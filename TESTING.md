# Testing Checklist

## Image Generation (LiteLLM) — Regression

1. Open the app, trigger AuthModal if no credentials stored
2. Enter LiteLLM Proxy URL and API Key, save
3. Open Image Studio
4. Select a model from the dropdown, enter a prompt, click Generate
5. Verify: image appears in canvas, no errors in console

## BytePlus API Key Management

### Auth Modal
1. Clear localStorage (`litellm_key`, `litellm_url`)
2. Reload the app
3. Verify: AuthModal shows both "LiteLLM Proxy URL" + "LiteLLM API Key" AND "BytePlus API Key (Video Generation)" sections
4. Enter all three fields, click "Initialize Studio"
5. Verify: `localStorage.getItem('byteplus_api_key')` returns the entered key
6. Reload — verify the BytePlus placeholder shows the masked key (e.g. `sk-••••••••1234`)

### Settings Modal
1. Open Settings (gear icon)
2. Verify: both LiteLLM and BytePlus sections are visible
3. Verify: BytePlus key input shows masked value if key exists
4. Click "Clear BytePlus Key" — verify it clears and button shows "Cleared"
5. Enter a new BytePlus key, click Save
6. Verify: `localStorage.getItem('byteplus_api_key')` returns the new key

## Video Generation — BytePlus Models

### Model Dropdown
1. Open Video Studio
2. Click model selector
3. Verify: "BytePlus Models" section header appears at top with Seedance models listed
4. Verify: LiteLLM models (if any) appear below under "LiteLLM Models" header
5. Search for "Seedance" — verify BytePlus models filter correctly

### Text-to-Video (Seedance 1.0 Pro Fast)
1. Select "Seedance 1.0 Pro Fast" from dropdown
2. Verify: Aspect Ratio (16:9, 9:16, 1:1, 4:3) and Duration (2-12s) controls update
3. Verify: Resolution dropdown shows 480p, 720p, 1080p
4. Enter a prompt, click Generate
5. Verify: button shows "Generating via BytePlus…"
6. Verify: video appears in canvas after polling completes (may take 30s-5min)
7. Verify: history entry is added with correct model/AR/duration

### Image-to-Video (Seedance 1.5 Pro — i2v only)
1. Select "Seedance 1.5 Pro" from dropdown
2. Do NOT upload an image — click Generate
3. Verify: error message "This model requires a start frame image"
4. Upload an image using the start frame picker
5. Enter a prompt, click Generate
6. Verify: video generates and appears in canvas

### Missing BytePlus Key
1. Clear `byteplus_api_key` from localStorage
2. Select a BytePlus model, enter prompt, click Generate
3. Verify: AuthModal opens (not an error alert)

## Video Generation — LiteLLM Models (Regression)

1. Select a LiteLLM-routed model from the dropdown
2. Enter a prompt, click Generate
3. Verify: generation goes through LiteLLM proxy as before
4. Verify: no BytePlus code path is triggered

## Build Verification

```bash
npm run build
# Should exit 0 with no errors
```

## No Hardcoded Secrets

```bash
grep -rn 'sk-' src/ --include='*.js' | grep -v placeholder
# Should return nothing
```
