// process-scratch.ts

import * as fse from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const INPUT_FILE = 'scratchon';
const OUTPUT_FILE = 'scratch2on';

interface DataObject {
  _id: string;
  [key: string]: any;
}

async function processJsonFile(): Promise<void> {
  console.log(`🚀 Starting JSON processing for '${INPUT_FILE}'...`);

  try {
    const inputPath = path.join(process.cwd(), INPUT_FILE);
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);

    const inputExists = await fse.pathExists(inputPath);
    if (!inputExists) {
      console.error(`❌ Input file '${INPUT_FILE}' does not exist!`);
      return;
    }

    const fileContent = await fse.readFile(inputPath, 'utf-8');
    const data: DataObject[] = JSON.parse(fileContent);

    const processedData = data.map(item => ({
      ...item,
      _id: uuidv4(),
    }));

    await fse.writeJson(outputPath, processedData, { spaces: 2 });

    console.log(`✅ Successfully processed '${INPUT_FILE}' and created '${OUTPUT_FILE}'`);
    console.log(`   Processed ${data.length} objects.`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ An error occurred: ${errorMessage}`);
  }
}

processJsonFile();
