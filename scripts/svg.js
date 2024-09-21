import { promises as fs } from "fs";
import { parse, stringify } from "svgson";
import svgPathBbox from "svg-path-bounding-box";

// Recursive function to calculate the bounding box of an SVG element
function getBoundingBox(svgJson) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  function traverseChildren(children) {
    children.forEach((child) => {
      if (child.name === "path") {
        const { x1, y1, x2, y2 } = svgPathBbox(child.attributes.d);
        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
      } else if (child.name === "rect") {
        const x = parseFloat(child.attributes.x || 0);
        const y = parseFloat(child.attributes.y || 0);
        const width = parseFloat(child.attributes.width || 0);
        const height = parseFloat(child.attributes.height || 0);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      } else if (child.name === "clipPath" || child.name === "g") {
        traverseChildren(child.children);
      }
      if (child.children && child.children.length > 0) {
        traverseChildren(child.children);
      }
    });
  }

  traverseChildren(svgJson.children);

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Function to adjust the viewBox of an SVG
async function adjustViewBox(filePath) {
  const svgContent = await fs.readFile(filePath, "utf8");
  const svgJson = await parse(svgContent);

  // Check for width and height attributes on the <svg> element
  const width = parseFloat(svgJson.attributes.width);
  const height = parseFloat(svgJson.attributes.height);

  if (!isNaN(width) && !isNaN(height)) {
    // Use width and height attributes to set the viewBox
    svgJson.attributes.viewBox = `0 0 ${width} ${height}`;
  } else {
    // Calculate the bounding box of the SVG content
    const bbox = getBoundingBox(svgJson);
    svgJson.attributes.viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
  }

  // Convert the JSON back to SVG
  const updatedSvgContent = stringify(svgJson);

  // Save the original SVG file with an -orig suffix
  const originalFilePath = filePath.replace(".svg", "-orig.svg");
  await fs.rename(filePath, originalFilePath);

  // Save the updated SVG file with the original name
  await fs.writeFile(filePath, updatedSvgContent, "utf8");
  console.log(`Original SVG saved to ${originalFilePath}`);
  console.log(`Updated SVG saved to ${filePath}`);
}

// Get the SVG file path from command-line arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide the path to the SVG file as a command-line argument.");
  process.exit(1);
}

// Adjust the viewBox of the specified SVG file
adjustViewBox(filePath);
