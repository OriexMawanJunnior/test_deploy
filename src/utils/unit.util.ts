/**
 * Converts resolution dimensions to aspect ratio in simplified form
 * @param width Width of the resolution
 * @param height Height of the resolution
 * @returns Aspect ratio as string in format "width:height"
 */
export function resolutionToAspectRatio(width: number, height: number): string {
  // Find the greatest common divisor using Euclidean algorithm
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);

  console.log(divisor)
  // Simplify the ratio by dividing both dimensions by GCD
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;

  return `${simplifiedWidth}:${simplifiedHeight}`;
}