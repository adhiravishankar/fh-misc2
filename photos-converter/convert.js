// convertToAvif.js

const sharp = require('sharp');
const fse = require('fs-extra');
const path = require('path');

// Configuration
const INPUT_DIR = './input-images';
const OUTPUT_DIR = './output-images';
const AVIF_QUALITY = 100; // Adjust quality (0-100)

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff'];

/**
 * Converts all images in the input directory to AVIF format
 */
async function convertImagesToAvif() {
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
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No supported image files found in the input directory.');
      return;
    }

    console.log(`📁 Found ${imageFiles.length} image(s) to convert:\n`);

    // Process each image
    let successCount = 0;
    let errorCount = 0;

    for (const [index, file] of imageFiles.entries()) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputFileName = `${path.parse(file).name}.avif`;
      const outputPath = path.join(OUTPUT_DIR, outputFileName);

      console.log(`[${index + 1}/${imageFiles.length}] Converting: ${file}`);

      try {
        // Get input file stats for comparison
        const inputStats = await fse.stat(inputPath);
        const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

        // Convert to AVIF using sharp
        const info = await sharp(inputPath)
          .avif({ 
            quality: AVIF_QUALITY,
            effort: 4 // Balance between speed and compression (0-9)
          })
          .toFile(outputPath);

        // Get output file size
        const outputStats = await fse.stat(outputPath);
        const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
        const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

        console.log(`   ✅ Success: ${outputFileName}`);
        console.log(`   📊 Size: ${inputSizeMB}MB → ${outputSizeMB}MB (${reduction}% reduction)`);
        console.log(`   📐 Dimensions: ${info.width}x${info.height}\n`);

        successCount++;
      } catch (error) {
        console.error(`   ❌ Error converting ${file}: ${error.message}\n`);
        errorCount++;
      }
    }

    // Summary
    console.log('━'.repeat(50));
    console.log('\n📊 Conversion Summary:');
    console.log(`   ✅ Successfully converted: ${successCount} image(s)`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed conversions: ${errorCount} image(s)`);
    }
    console.log(`   📁 Output directory: ${OUTPUT_DIR}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the conversion
convertImagesToAvif();
