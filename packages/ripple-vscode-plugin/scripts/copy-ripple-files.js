const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../../'); // Adjust path to reach project root
const destDir = path.resolve(__dirname, '../dist/node_modules/ripple');

const filesToCopy = [
	{
		source: 'packages/ripple/src/compiler/index.js',
		destination: 'src/compiler/index.js',
	},
	{
		source: 'packages/ripple/src/jsx-runtime.js',
		destination: 'src/jsx-runtime.js',
	},
];

async function copyFiles() {
	try {
		// Ensure the destination directory is clean
		if (fs.existsSync(destDir)) {
			await fs.promises.rm(destDir, { recursive: true, force: true });
		}
		await fs.promises.mkdir(destDir, { recursive: true });

		for (const file of filesToCopy) {
			const sourcePath = path.join(projectRoot, file.source);
			const destinationPath = path.join(destDir, file.destination);
			const destinationDirPath = path.dirname(destinationPath);

			if (!fs.existsSync(sourcePath)) {
				console.error(`Source file not found: ${sourcePath}`);
				process.exit(1);
			}

			await fs.promises.mkdir(destinationDirPath, { recursive: true });
			await fs.promises.copyFile(sourcePath, destinationPath);
			console.log(`Copied ${file.source} to ${destinationPath}`);
		}
		console.log('Ripple files copied successfully.');
	} catch (error) {
		console.error('Error copying Ripple files:', error);
		process.exit(1);
	}
}

copyFiles();
