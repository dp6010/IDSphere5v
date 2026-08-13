const fs = require('fs');
let code = fs.readFileSync('src/pages/PhotoUpload.tsx', 'utf8');

code = code.replace(
  "  const isPostRegistration = !!registrationId || !!formConfig?.registrationId;\n  const isTokenSession = !!token;\n  const [formConfig, setFormConfig] = useState",
  "  const isTokenSession = !!token;\n  const [formConfig, setFormConfig] = useState"
);

code = code.replace(
  "  const [successFileId, setSuccessFileId] = useState<string | null>(null);",
  "  const [successFileId, setSuccessFileId] = useState<string | null>(null);\n  const isPostRegistration = !!registrationId || !!formConfig?.registrationId;"
);

fs.writeFileSync('src/pages/PhotoUpload.tsx', code);
