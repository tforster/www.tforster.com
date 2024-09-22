import { promises as fs } from "fs";
import { parse, stringify } from "svgson";
import svgPathBbox from "svg-path-bounding-box";

/**
 * @description: A class to optimise SVG files. Currently has just one public method to optimise the SVG viewbox.
 * @class SVGOptimise
 */
class SVGOptimise {
  /**
   * @description: Public method to optimise the SVG viewbox by removing any unnecessary padding around the SVG.
   * @param {string} filePath:  The local filesystem path to the SVG file to optimise.
   * @returns {void}:           Creates a new file with the optimisation, preserving the original file.
   * @memberof SVGOptimise
   */
  async adjustViewBox(filePath) {
    // Read the SVG file
    const svgContent = await fs.readFile(filePath, "utf8");
    // Parse the SVG content into JSON
    const svgJson = await parse(svgContent);

    // Check for width and height attributes on the <svg> element
    const width = parseFloat(svgJson.attributes.width);
    const height = parseFloat(svgJson.attributes.height);

    if (!isNaN(width) && !isNaN(height)) {
      // Use width and height attributes to set the viewBox
      svgJson.attributes.viewBox = `0 0 ${width} ${height}`;
    } else {
      // Calculate the bounding box of the SVG content
      const bbox = this.#getBoundingBox(svgJson);
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

  /**
   * @description: Private method to calculate the bounding box.
   * @param {string} svgJson: The SVG content in JSON format.
   * @return {object}:        The calculated bounding box.
   * @memberof SVGOptimise
   */
  #getBoundingBox(svgJson) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    /**
     * @description: Recursively traverses the children of an SVG element to calculate the bounding box.
     * @param {string} children:  The children of an SVG element in JSON format
     */
    function traverseChildrenR(children) {
      children.forEach((child) => {
        switch (child.name) {
          case "path": {
            const { x1, y1, x2, y2 } = svgPathBbox(child.attributes.d);
            minX = Math.min(minX, x1);
            minY = Math.min(minY, y1);
            maxX = Math.max(maxX, x2);
            maxY = Math.max(maxY, y2);
            break;
          }
          case "rect": {
            const x = parseFloat(child.attributes.x || 0);
            const y = parseFloat(child.attributes.y || 0);
            const width = parseFloat(child.attributes.width || 0);
            const height = parseFloat(child.attributes.height || 0);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
            break;
          }
          case "clipPath":
          case "g": {
            traverseChildrenR(child.children);
            break;
          }
        }
        if (child.children && child.children.length > 0) {
          traverseChildrenR(child.children);
        }
      });
    }

    traverseChildrenR(svgJson.children);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

// Get the SVG file path from command-line arguments
const svgPath = process.argv[2];
if (!svgPath) {
  console.error("Please provide the path to the SVG file as a command-line argument.");
  process.exit(1);
} else {
  // Create an instance of SVGOptimise and adjust the SVG viewbox
  const svgOptimise = new SVGOptimise();
  svgOptimise.adjustViewBox(svgPath);
}
