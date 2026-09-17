import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'listen-write';
const outputDirectory = resolve('dist/client');
const nestedNextDirectory = resolve(outputDirectory, repositoryName, '_next');
const nextDirectory = resolve(outputDirectory, '_next');

await rm(nextDirectory, { recursive: true, force: true });
await mkdir(nextDirectory, { recursive: true });
await cp(nestedNextDirectory, nextDirectory, { recursive: true });
await rm(resolve(outputDirectory, repositoryName), { recursive: true, force: true });
