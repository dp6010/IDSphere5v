import { googleService } from './src/server/google.js';
(async () => {
  const forms = await googleService.getForms('ORG001');
  console.log(forms);
})();
