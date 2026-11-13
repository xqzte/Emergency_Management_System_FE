# API contract (from the Backend Integration Guide)

Dev base URL: http://localhost:8080 (the gateway). Staging and production URLs are not set yet.
Send `Authorization: Bearer <token>` on everything except Public endpoints. Use `credentials: 'include'`.
Rate limits per client and path: login 5/min, register 3/min, hospital register 3/min, SOS request 10/min, everything else 30/min.
Swagger JSON per service: GET /auth-service/v3/api-docs, /hospital-service/..., /emergency-service/..., /notification-service/..., /routing-service/...

## Errors
- 400 validation: {"error":"Validation failed","fields":{"email":"Must be a valid email address"}}. Show field messages next to inputs.
- 400/404/409/500: {"error":"message"}. Show as a toast. 409 = assignment already taken, or no hospital available.
- 429: rate limit, plain response. 401/403: Spring default, not JSON. On 401 refresh the token once and retry once.
- Several successes return plain text, for example "Registration successful".

## Auth (Public unless noted)
- POST /auth/register {fullName,email,phoneNumber,password (min 8),role:"PATIENT"} then POST /auth/verify-otp {email,otp 6 digits}. POST /auth/resend-otp {email,channel:"EMAIL"}.
- POST /auth/login {email,password} gives {token,role,userId,requiresTwoFactor,message} and sets the refreshToken cookie (HttpOnly, 7 days). If requiresTwoFactor is true there is no token yet: POST /auth/verify-2fa {email,otp}.
- POST /auth/refresh (cookie only) gives {accessToken,role,userId}. Token lasts 15 minutes. Claims: userId, role, hospitalId, userName, userEmail.
- POST /auth/logout, GET /auth/me {id,fullName,email,phoneNumber,role,hospitalId}, PUT /auth/change-password {currentPassword,newPassword}, PUT /auth/toggle-2fa.
- POST /auth/forgot-password {email}, POST /auth/reset-password {email,otp,newPassword}.
- Admin only: POST /auth/staff {fullName,email,phoneNumber,password}, GET /auth/staff, DELETE /auth/staff/{staffId}.

## Patient profile and documents (PATIENT)
- GET and PUT /profile/health: gender (MALE,FEMALE), dateOfBirth (YYYY-MM-DD), weightKg, heightCm, bloodGroup, genotype, allergies,
  medicalConditions, currentMedications, surgicalHistory, emergencyContactName/Phone/Relation, primaryPhysicianName/Phone/Hospital,
  insuranceProvider, insurancePolicyNumber, insuranceGroupNumber.
- bloodGroup: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE, AB_POSITIVE, AB_NEGATIVE (show as A+ but send the enum). genotype: AA, AS, SS, AC, SC.
- Documents: POST /profile/documents multipart {file,documentType,title,description?}; GET /profile/documents; GET /profile/documents/{id}/download; DELETE /profile/documents/{id}.
  PDF, JPEG, JPG, PNG, WEBP only, max 10 MB. Types: LAB_RESULT, XRAY, MRI_SCAN, CT_SCAN, ULTRASOUND, PRESCRIPTION, VACCINATION_RECORD, INSURANCE_CARD, REFERRAL_LETTER, DISCHARGE_SUMMARY, OTHER.
- Staff and admin view a patient snapshot: GET /profile/patients/{patientId}/health.

## Hospitals
- GET /hospital/nearest?latitude=&longitude=&limit=5 (no radius; fixed 250 km; only approved hospitals with beds). Returns HospitalResponse[], nearest first.
  HospitalResponse: id,name,address,contactNumber,latitude,longitude,totalBeds,availableBeds,hospitalType,hospitalStatus,distanceKm,adminId,adminName,adminEmail,adminPhone.
- GET /hospital/{id}/public. GET /hospital/{id} (staff, admin).
- POST /hospital/register (Public): name,address,contactNumber,latitude,longitude,totalBeds (>0),hospitalType (PRIVATE,PUBLIC,MISSION,FEDERAL),registrationNumber,licensingAuthority,licenseExpiryDate (YYYY-MM-DD),specialties,
  facility flags (expected keys has24HourEmergency, hasICU, hasBloodBank, hasAmbulance, hasTraumaUnit, hasOperatingTheatre: confirm in Swagger), adminFullName, adminEmail, adminPhoneNumber, adminPassword (min 8). Hospital stays PENDING until the super admin approves.
- Admin: PUT /hospital/my/details {address,contactNumber,latitude,longitude} (name not editable), PUT /hospital/my/total-beds?totalBeds=, PUT /hospital/{id}/beds?availableBeds=.
- Staff and admin: PUT /hospital/{id}/beds/increment?count= and /beds/decrement?count= (204).

## Emergency (patient)
- POST /emergency/request {latitude,longitude,patientCount (>=1),description,requestMode (BROADCAST|DIRECT),transportMode (AMBULANCE|SELF),preferredHospitalId (DIRECT),triageLevel (optional, default ORANGE),patientAge,patientGender,patientConscious,additionalNotes}.
- GET /emergency/my-requests, GET /emergency/requests/{id}, GET /emergency/requests/{id}/assignment, GET /emergency/requests/{id}/hospital-contact.
- PUT /emergency/requests/{id}/location {latitude,longitude} about every 5 s while ACCEPTED (limit 30/min; never faster than every 2 s). PUT .../cancel (only before a hospital accepts), .../complete, .../feedback {rating 1-5, feedback?}.
- GET /routing/route?originLat=&originLng=&destLat=&destLng= gives {distanceKm,estimatedDurationMinutes,points[{lat,lng}],provider}.

## Emergency (hospital staff and admin)
- GET /emergency/assignments/{hospitalId}: all assignments, no filters, no pagination. PUT /emergency/assignments/{id}/accept, /reject, /arrived (no body). Accept returns 409 if another hospital got it.
- Assignment: id,hospitalId,hospitalName,hospitalContactNumber,patientsAssigned,status,distanceKm,assignedAt,respondedAt,arrivalTime,timeoutAt, nested emergencyRequest (patient name, coordinates, count, description, triage level, patient id).
- GET /emergency/requests/{id}/patient-location gives {latitude,longitude}.
- GET /emergency/assignments/{hospitalId}/stats (total, pending, accepted, rejected, arrived). Admin: /advanced-stats (todayTotal, todayAccepted, todayRejected, totalAccepted, totalPending, totalRejected, totalArrived, avgResponseTimeSeconds).
- Admin: GET /emergency/logs/hospital/{hospitalId}. Staff and admin: GET /emergency/logs/assignment/{assignmentId}. Do NOT use /emergency/logs/staff/{id} (backend bug).

## Notifications
- GET /notifications/my, /my/unread, /my/unread/count. PUT /notifications/{id}/read, /my/read-all. Staff and admin: GET /notifications/hospital/{hospitalId}.
