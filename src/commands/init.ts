import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function runInit(): Promise<void> {
  const configPath = path.join(process.cwd(), '.devnorm.json');
  const homeConfigPath = path.join(os.homedir(), '.devnormrc');

  console.log('🚀 DevNorm Init\n');

  // Check for existing config
  if (fs.existsSync(configPath)) {
    console.log('✅ .devnorm.json already exists in current directory');
    return;
  }

  if (fs.existsSync(homeConfigPath)) {
    console.log('✅ ~/.devnormrc found, will use global config');
  }

  // Check for API key in environment
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    console.log('\n⚠️  MINIMAX_API_KEY not found in environment.');
    console.log('   Set it with: export MINIMAX_API_KEY=your_key');
    console.log('   Or run: devnorm init --api-key your_key\n');
  } else {
    console.log('✅ MINIMAX_API_KEY found in environment');
  }

  // Create local config
  const localConfig = {
    version: 1,
    apiUrl: 'https://api.minimaxi.com/anthropic/v1/messages',
    model: 'M2.7-highspeed',
  };

  fs.writeFileSync(configPath, JSON.stringify(localConfig, null, 2));
  console.log(`✅ Created .devnorm.json in ${process.cwd()}`);
  console.log('\n📋 Next steps:');
  console.log('   devnorm review ./src    # Review your code');
  console.log('   devnorm --help          # See all commands');
}
