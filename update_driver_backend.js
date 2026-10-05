const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-backend/src/main/java/com/streetify/controller/ModuleAdminController.java';
let content = fs.readFileSync(file, 'utf8');

const oldDocs = `        // Handle Documents (Dummy documents for Admin entry)
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
            licDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(licDoc);
        }`;

const newDocs = `        // Handle Documents
        if (data.containsKey("nicFile") && data.get("nicFile") instanceof Map) {
            Map<String, Object> fileData = (Map<String, Object>) data.get("nicFile");
            String base64 = (String) fileData.get("base64");
            if (base64 != null && base64.contains(",")) base64 = base64.split(",")[1];
            try {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64);
                String originalName = (String) fileData.get("name");
                java.io.File dir = new java.io.File("uploads/documents/" + saved.getId());
                if (!dir.exists()) dir.mkdirs();
                String filePath = "uploads/documents/" + saved.getId() + "/nic_" + System.currentTimeMillis() + "_" + originalName;
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), decoded);
                
                com.streetify.entity.DriverDocument nicDoc = new com.streetify.entity.DriverDocument();
                nicDoc.setDriver(saved);
                nicDoc.setDocType("nic");
                nicDoc.setOriginalFilename(originalName);
                nicDoc.setFilePath(filePath);
                nicDoc.setFileSizeBytes((long) decoded.length);
                nicDoc.setContentType((String) fileData.get("type"));
                nicDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
                nicDoc.setReviewerNote("Uploaded by Admin. NIC: " + data.get("nicStr"));
                nicDoc.setReviewedAt(java.time.LocalDateTime.now());
                driverDocumentDAO.save(nicDoc);
            } catch (Exception e) { e.printStackTrace(); }
        } else if (data.containsKey("nicStr") || data.containsKey("nic")) {
            String nicVal = data.containsKey("nicStr") ? (String) data.get("nicStr") : (String) data.get("nic");
            com.streetify.entity.DriverDocument nicDoc = new com.streetify.entity.DriverDocument();
            nicDoc.setDriver(saved);
            nicDoc.setDocType("nic");
            nicDoc.setOriginalFilename("admin_entry_nic.txt");
            nicDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_nic.txt");
            nicDoc.setFileSizeBytes(1024L);
            nicDoc.setContentType("text/plain");
            nicDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            nicDoc.setReviewerNote("Manually entered NIC by Admin: " + nicVal);
            nicDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(nicDoc);
        }
        
        if (data.containsKey("licenseFile") && data.get("licenseFile") instanceof Map) {
            Map<String, Object> fileData = (Map<String, Object>) data.get("licenseFile");
            String base64 = (String) fileData.get("base64");
            if (base64 != null && base64.contains(",")) base64 = base64.split(",")[1];
            try {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64);
                String originalName = (String) fileData.get("name");
                java.io.File dir = new java.io.File("uploads/documents/" + saved.getId());
                if (!dir.exists()) dir.mkdirs();
                String filePath = "uploads/documents/" + saved.getId() + "/license_" + System.currentTimeMillis() + "_" + originalName;
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), decoded);
                
                com.streetify.entity.DriverDocument licDoc = new com.streetify.entity.DriverDocument();
                licDoc.setDriver(saved);
                licDoc.setDocType("license");
                licDoc.setOriginalFilename(originalName);
                licDoc.setFilePath(filePath);
                licDoc.setFileSizeBytes((long) decoded.length);
                licDoc.setContentType((String) fileData.get("type"));
                licDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
                licDoc.setReviewerNote("Uploaded by Admin. License: " + data.get("licenseStr"));
                licDoc.setReviewedAt(java.time.LocalDateTime.now());
                driverDocumentDAO.save(licDoc);
            } catch (Exception e) { e.printStackTrace(); }
        } else if (data.containsKey("licenseStr") || data.containsKey("licenseNumber")) {
            String licVal = data.containsKey("licenseStr") ? (String) data.get("licenseStr") : (String) data.get("licenseNumber");
            com.streetify.entity.DriverDocument licDoc = new com.streetify.entity.DriverDocument();
            licDoc.setDriver(saved);
            licDoc.setDocType("license");
            licDoc.setOriginalFilename("admin_entry_license.txt");
            licDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_license.txt");
            licDoc.setFileSizeBytes(1024L);
            licDoc.setContentType("text/plain");
            licDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            licDoc.setReviewerNote("Manually entered License by Admin: " + licVal);
            licDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(licDoc);
        }`;

content = content.replace(oldDocs, newDocs);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ModuleAdminController backend');
