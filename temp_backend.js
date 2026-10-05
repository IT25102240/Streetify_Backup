const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-backend/src/main/java/com/streetify/controller/ModuleAdminController.java';
let content = fs.readFileSync(file, 'utf8');

const newFunction = `    @PostMapping("/drivers")
    public ResponseEntity<Map<String, Object>> createDriver(@RequestBody Map<String, Object> data) {
        String email = data.containsKey("email") && data.get("email") != null ? ((String) data.get("email")).trim().toLowerCase() : "";
        if (email.isEmpty() || !isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Email must be a valid email address containing the '@' symbol (e.g. driver@streetify.lk)."
            ));
        }
        if (userDAO.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Email '" + email + "' is already registered."
            ));
        }

        String phone = (String) data.get("phone");
        if (phone == null || phone.isBlank() || !isValidDriverPhone(phone)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567)."
            ));
        }

        Driver d = new Driver();
        if (data.containsKey("firstName")) d.setFirstName((String) data.get("firstName"));
        if (data.containsKey("lastName"))  d.setLastName((String) data.get("lastName"));
        d.setEmail(email);
        d.setPhone(phone);
        
        if (data.containsKey("nic")) d.setNic((String) data.get("nic"));
        if (data.containsKey("licenseNumber")) d.setLicenseNumber((String) data.get("licenseNumber"));
        
        String rawPassword = data.containsKey("password") && data.get("password") != null && !((String) data.get("password")).isBlank()
            ? ((String) data.get("password")).trim()
            : "1111";
        d.setPasswordHash(passwordEncoder.encode(rawPassword));
        d.setPlainPassword(rawPassword);
        d.setRole(UserRole.DRIVER);
        d.setActive(true);
        d.setVerificationStatus(DriverVerificationStatus.APPROVED);
        
        // Handle Vehicle & Security
        Vehicle vehicle = new Vehicle();
        vehicle.setDriver(d);
        vehicle.setVehicleType(data.containsKey("vehicleType") ? (String) data.get("vehicleType") : "car");
        vehicle.setMake(data.containsKey("make") ? (String) data.get("make") : "Toyota");
        vehicle.setModel(data.containsKey("model") ? (String) data.get("model") : "Prius");
        vehicle.setNumberPlate(data.containsKey("numberPlate") ? (String) data.get("numberPlate") : "CBA-1234");
        
        Object yearObj = data.get("year");
        if (yearObj != null) {
            if (yearObj instanceof Number) {
                vehicle.setYearOfManufacture(((Number) yearObj).intValue());
            } else if (yearObj instanceof String) {
                try { vehicle.setYearOfManufacture(Integer.parseInt((String) yearObj)); } catch (Exception e) { vehicle.setYearOfManufacture(2015); }
            }
        } else {
            vehicle.setYearOfManufacture(2015);
        }
        
        vehicle.setColor(data.containsKey("color") ? (String) data.get("color") : "White");
        d.setVehicle(vehicle);
        
        Driver saved = driverDAO.save(d);
        
        // Handle Documents (Dummy documents for Admin entry)
        if (data.containsKey("nic")) {
            com.streetify.entity.DriverDocument nicDoc = new com.streetify.entity.DriverDocument();
            nicDoc.setDriver(saved);
            nicDoc.setDocType("nic");
            nicDoc.setOriginalFilename("admin_entry_nic.txt");
            nicDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_nic.txt");
            nicDoc.setFileSizeBytes(1024L);
            nicDoc.setContentType("text/plain");
            nicDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            nicDoc.setReviewerNote("Manually entered NIC by Admin: " + data.get("nic"));
            nicDoc.setUploadedAt(java.time.LocalDateTime.now());
            nicDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(nicDoc);
        }
        
        if (data.containsKey("licenseNumber")) {
            com.streetify.entity.DriverDocument licDoc = new com.streetify.entity.DriverDocument();
            licDoc.setDriver(saved);
            licDoc.setDocType("license");
            licDoc.setOriginalFilename("admin_entry_license.txt");
            licDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_license.txt");
            licDoc.setFileSizeBytes(1024L);
            licDoc.setContentType("text/plain");
            licDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            licDoc.setReviewerNote("Manually entered License by Admin: " + data.get("licenseNumber"));
            licDoc.setUploadedAt(java.time.LocalDateTime.now());
            licDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(licDoc);
        }
        
        logAdminAction("CREATE_DRIVER", "Created new driver: " + saved.getEmail(), saved.getId(), "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }`;

if (content.indexOf('public ResponseEntity<Map<String, Object>> createDriver') !== -1) {
    let startIndex = content.indexOf('    @PostMapping("/drivers")');
    let nextMapping = content.indexOf('    @PostMapping', startIndex + 20);
    
    let extractedOld = content.substring(startIndex, nextMapping);
    
    content = content.replace(extractedOld, newFunction + '\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated ModuleAdminController.java');
} else {
    console.log('Function not found!');
}
