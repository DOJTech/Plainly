# Plainly

Understand any bill, medicine label, form, contract or message in plain words, with a scam check.
Built by Dolapo Oyatomi.

## Files
- `index.html` the whole app
- `netlify/functions/explain.js` secure server function (holds your API key)
- `netlify.toml` Netlify settings
- `manifest.webmanifest` + `icon.svg` let people add Plainly to their phone home screen

## Deploy (about 10 minutes)
1. Get an API key at console.anthropic.com and set a monthly spending limit.
2. Put these files in a new GitHub repository.
3. On netlify.com choose Add new site > Import from GitHub > pick the repo > Deploy.
4. In Netlify open Site configuration > Environment variables and add:
   - `ANTHROPIC_API_KEY` = your key (required)
   - `ANTHROPIC_MODEL` = `claude-haiku-5-5` (optional: faster and cheaper)
5. Trigger a new deploy, open the site on your phone and test photo, text and voice.

Never commit your API key to GitHub.

## Feedback
The "How did Plainly do?" box sends to Netlify Forms. After deploying, open your site in Netlify > Forms > feedback to read every submission (free plan includes 100 per month).
