const fs = require('fs');
const file = 'e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/streetify-frontend/src/screens/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldOnChange = `                      onChange={e => {
                        if (!f.readOnly && !f.disabled) {
                          setFormData({ ...formData, [f.id]: e.target.value });
                        }
                      }}`;

const newOnChange = `                      onChange={e => {
                        if (!f.readOnly && !f.disabled) {
                          let val = e.target.value;
                          if (f.id.toLowerCase().includes("phone")) {
                            if (val.length > 0) {
                              // If they typed just a number, format it
                              if (!val.startsWith("+94")) {
                                if (val.startsWith("0")) val = "+94" + val.substring(1);
                                else if (val.startsWith("+")) val = "+94" + val.replace(/[^\d]/g, '').substring(2);
                                else val = "+94" + val;
                              }
                              // Strip invalid chars
                              val = val.replace(/[^\d+]/g, '');
                              // Limit to 9 digits after +94
                              if (val.startsWith("+94")) {
                                val = "+94" + val.substring(3).substring(0, 9);
                              }
                            }
                          }
                          setFormData({ ...formData, [f.id]: val });
                        }
                      }}`;

content = content.replace(oldOnChange, newOnChange);
fs.writeFileSync(file, content, 'utf8');
console.log('Updated Admin.tsx for phone number input realtime validation');
