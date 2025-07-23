// convertToAvif.ts

import sharp from 'sharp';
import * as fse from 'fs-extra';
import * as path from 'path';
import { v4 } from 'uuid'; // Importing UUID for unique file names

// Configuration
const INPUT_DIR = './input_images';
const OUTPUT_DIR = './output_images';
const AVIF_QUALITY = 90; // Adjust quality (0-100)

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.avif'];

interface ConversionResult {
  fileName: string;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Converts all images in the input directory to AVIF format
 */
async function convertImagesToAvif(): Promise<void> {
  console.log('🚀 Starting image conversion to AVIF...\n');

  try {
    // Ensure input directory exists
    const inputExists = await fse.pathExists(INPUT_DIR);
    if (!inputExists) {
      console.error(`❌ Input directory '${INPUT_DIR}' does not exist!`);
      return;
    }

    // Ensure output directory exists (create if it doesn't)
    await fse.ensureDir(OUTPUT_DIR);
    console.log(`✅ Output directory '${OUTPUT_DIR}' is ready.\n`);

    // Read all files from input directory
    const files = await fse.readdir(INPUT_DIR);

    // Filter for supported image files
    const imageFiles = files.filter((file: string): boolean => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No supported image files found in the input directory.');
      return;
    }

    console.log(`📁 Found ${imageFiles.length} image(s) to convert:\n`);

    // Process each image
    const results: ConversionResult[] = [];

    for (const [index, file] of imageFiles.entries()) {
      const result = await processImage(file, index + 1, imageFiles.length);
      results.push(result);
    }

    // Display summary
    displaySummary(results);

  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Process a single image file
 */
async function processImage(
  file: string,
  current: number,
  total: number
): Promise<ConversionResult> {
  const inputPath = path.join(INPUT_DIR, file);
  const outputFileName = `${v4()}.avif`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  console.log(`[${current}/${total}] Converting: ${file}`);

  try {
    // Get input file stats
    const inputStats = await fse.stat(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

    // Convert to AVIF using sharp [[8]]
    const info = await sharp(inputPath)
      .avif({ effort: 9 })
      .toFile(outputPath); // Write the output image data to a file [[1]]

    // Get output file size
    const outputStats = await fse.stat(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`   ✅ Success: ${outputFileName}`);
    console.log(`   📊 Size: ${inputSizeMB}MB → ${outputSizeMB}MB (${reduction}% reduction)`);
    console.log(`   📐 Dimensions: ${info.width}x${info.height}\n`);

    return {
      fileName: file,
      success: true,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      dimensions: {
        width: info.width,
        height: info.height
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error converting ${file}: ${errorMessage}\n`);

    return {
      fileName: file,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Display conversion summary
 */
function displaySummary(results: ConversionResult[]): void {
  console.log('━'.repeat(50));
  console.log('\n📊 Conversion Summary:');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`   ✅ Successfully converted: ${successful.length} image(s)`);

  if (failed.length > 0) {
    console.log(`   ❌ Failed conversions: ${failed.length} image(s)`);
    failed.forEach(f => {
      console.log(`      - ${f.fileName}: ${f.error}`);
    });
  }

  // Calculate total size reduction
  if (successful.length > 0) {
    const totalInputSize = successful.reduce((sum, r) => sum + (r.inputSize || 0), 0);
    const totalOutputSize = successful.reduce((sum, r) => sum + (r.outputSize || 0), 0);
    const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

    console.log(`   💾 Total size reduction: ${totalReduction}%`);
  }

  console.log(`   📁 Output directory: ${OUTPUT_DIR}\n`);
}

// Run the conversion
convertImagesToAvif();
