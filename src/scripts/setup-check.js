import 'dotenv/config';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const required = [
  ['DISCORD_TOKEN', (v) => v && !v.includes('votre_token')],
  ['CLIENT_ID', (v) => v && !v.includes('votre_client')],
  ['GUILD_ID', (v) => v && !v.includes('votre_serveur')],
];

const recommended = [
  'VERIFICATION_CHANNEL_ID',
  'UNVERIFIED_ROLE_ID',
  'MEMBER_ROLE_ID',
  'WELCOME_CHANNEL_ID',
  'QUIZ_CHANNEL_ID',
];

console.log('\n🔍 Vérification configuration Syryana Bot\n');

if (!existsSync(join(root, '.env'))) {
  console.error('❌ Fichier .env manquant. Lance: copy .env.example .env');
  process.exit(1);
}

let ok = true;
for (const [key, test] of required) {
  const val = process.env[key];
  if (!test(val)) {
    console.error(`❌ ${key} — obligatoire, pas encore configuré`);
    ok = false;
  } else {
    console.log(`✅ ${key}`);
  }
}

console.log('\nRecommandé (vérification entrée + quiz) :');
for (const key of recommended) {
  const val = process.env[key];
  console.log(val ? `✅ ${key}` : `⚠️  ${key} — vide`);
}

if (!ok) {
  console.log('\n📝 Édite le fichier .env puis relance: npm run setup\n');
  process.exit(1);
}

console.log('\n✅ Configuration minimale OK. Lance:\n   npm run deploy-commands\n   npm start\n');
