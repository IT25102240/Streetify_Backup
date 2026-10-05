const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update FormField type
content = content.replace(
  `  type?: "text" | "number" | "select" | "password" | "location";`,
  `  type?: "text" | "number" | "select" | "password" | "location" | "file";`
);

// 2. Add file input handling in AdminFormModal
const oldInputRender = `              ) : (() => {
                const errorMsg = getFieldError(f.id, formData[f.id]);
                return (
                  <div className="flex flex-col gap-1">
                    <input
                      type={f.type || "text"}
                      readOnly={f.readOnly}
                      disabled={f.disabled}`;

const newInputRender = `              ) : f.type === "file" ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    disabled={f.disabled}
                    className="bg-navy-dark border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-eco outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-eco file:text-white hover:file:bg-eco-dark transition-all"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ 
                            ...formData, 
                            [f.id]: { 
                              name: file.name, 
                              type: file.type, 
                              size: file.size, 
                              base64: reader.result 
                            } 
                          });
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setFormData({ ...formData, [f.id]: null });
                      }
                    }}
                  />
                  {formData[f.id] && formData[f.id].name && (
                    <p className="text-xs text-eco flex items-center gap-1 mt-1">
                      <span>✅</span> {formData[f.id].name} attached
                    </p>
                  )}
                </div>
              ) : (() => {
                const errorMsg = getFieldError(f.id, formData[f.id]);
                return (
                  <div className="flex flex-col gap-1">
                    <input
                      type={f.type || "text"}
                      readOnly={f.readOnly}
                      disabled={f.disabled}`;

content = content.replace(oldInputRender, newInputRender);

// 3. Update handleAdd for driver to use file type
const oldDriverAddFields = `      // Documents
      { id: "nic", label: "NIC Number (Documents)", defaultValue: "951234567V" },
      { id: "licenseNumber", label: "License Number", defaultValue: "B1234567" }
    ]);`;

const newDriverAddFields = `      // Documents
      { id: "nicStr", label: "NIC Number (Documents)", defaultValue: "951234567V" },
      { id: "nicFile", label: "Upload NIC Image/Document", type: "file" },
      { id: "licenseStr", label: "License Number", defaultValue: "B1234567" },
      { id: "licenseFile", label: "Upload License Image/Document", type: "file" }
    ]);`;

content = content.replace(oldDriverAddFields, newDriverAddFields);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added file upload UI fields to Admin.tsx');
