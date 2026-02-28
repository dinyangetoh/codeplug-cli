import type { CodePlugConfig } from '../../config/types.js';

export async function handleConfigSet(key: string, value: string): Promise<void> {
  const chalk = (await import('chalk')).default;
  const { ConfigManager } = await import('../../config/ConfigManager.js');

  const config = new ConfigManager(process.cwd());
  await config.load();

  const tierWarning = key === 'models.tier' && value === 'lite';

  config.set(key as keyof CodePlugConfig, value);
  await config.save();

  console.log(chalk.green(`✅ Set ${key} = ${value}`));

  if (tierWarning) {
    console.log(chalk.yellow(
      '\n⚠ Model tier set to "lite". Lighter models will be used for classification,\n' +
      '  summarization, and NER. This reduces disk/RAM usage but may lower detection\n' +
      '  accuracy and documentation quality. Recommended only for machines with < 8GB RAM.',
    ));
  }
}

export async function handleConfigGet(key: string): Promise<void> {
  const chalk = (await import('chalk')).default;
  const { ConfigManager } = await import('../../config/ConfigManager.js');

  const config = new ConfigManager(process.cwd());
  await config.load();

  const value = config.get(key);
  if (value === undefined) {
    console.log(chalk.yellow(`Key "${key}" not found.`));
  } else {
    console.log(`${key} = ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
  }
}

export async function handleConfigList(): Promise<void> {
  const { ConfigManager } = await import('../../config/ConfigManager.js');

  const config = new ConfigManager(process.cwd());
  await config.load();

  console.log(JSON.stringify(config.getAll(), null, 2));
}
