import { injectable } from "inversify";

@injectable()
export class DifferenceEnlarger {

    private readonly IS_A_DIFFERENCE: number = 0;   // a mettre dans les constantes
    private readonly BMP_HEADER_SIZE: number = 54;  // a mettre dans les constantes
    private readonly PIXEL_SIZE:      number = 3;   // a mettre dans les constantes

    private enlargedDifferences: Buffer;

    public constructor(public readonly differencesFound: Buffer, public width: number, public radius: number) {
        this.enlargedDifferences = Buffer.from(differencesFound);
    }

    public circleAllDifferences(): Buffer {

        for (let bytePos: number = this.BMP_HEADER_SIZE; bytePos < this.enlargedDifferences.length; bytePos += this.PIXEL_SIZE) {
            if (this.differencesFound[bytePos] === this.IS_A_DIFFERENCE) {
                const pixelIndex: number = this.convertToPixelPosition(bytePos);
                this.drawCircleAround(pixelIndex);
            }
        }

        return this.enlargedDifferences;
    }

    private drawCircleAround(pixelToCircle: number): void {
        // to get the square size where the draw circle should be called
        const squareSizeInPixels: number = this.radius + this.radius + 1;
        const startPixelIndex: number = this.getSquareStartPixelIndex(pixelToCircle);

        for (let row: number = 0; row < squareSizeInPixels; row++) {
            for (let col: number = 0; col < squareSizeInPixels; col++) {

                const currentPixelPosition: number = row * this.width + col + startPixelIndex;

                if (currentPixelPosition >= 0 && currentPixelPosition < this.numberOfPixelsInImage()) {

                    const currentDistanceToCenter: number = this.findDistanceBetween(pixelToCircle, currentPixelPosition);

                    if (this.isInAdjustedRadius(currentDistanceToCenter)) {
                        this.setPixelAsDifference(currentPixelPosition);
                    }
                }
            }
        }
    }

    private setPixelAsDifference(pixelPosition: number): void {
        const firstByte: number = this.convertToBytePosition(pixelPosition);

        for (let offset: number = 0; offset < this.PIXEL_SIZE; offset++) {
            this.enlargedDifferences[firstByte + offset] = this.IS_A_DIFFERENCE;
        }
    }

    // will only work with an image that's a width multiple of 4
    private numberOfPixelsInImage(): number {
        const imageSizeInBytes: number = this.differencesFound.length - this.BMP_HEADER_SIZE;

        return Math.floor(imageSizeInBytes / this.PIXEL_SIZE);
    }

    // will only work with an image that's a width multiple of 4
    private convertToPixelPosition(bytePosition: number): number {
        return Math.floor(bytePosition / this.PIXEL_SIZE);
    }

    // will only work with an image that's a width multiple of 4
    private convertToBytePosition(pixelPosition: number): number {
        return pixelPosition * this.PIXEL_SIZE;
    }

    private getSquareStartPixelIndex(pixelCenterPosition: number): number {
        return pixelCenterPosition - this.width * this.radius - this.radius;
    }

    private findDistanceBetween(centerPixelPosition: number, periphericPixelPosition: number): number {
        const deltaX: number = periphericPixelPosition % this.width - centerPixelPosition % this.width;
        const deltaY: number = Math.floor(periphericPixelPosition / this.width) - Math.floor(centerPixelPosition / this.width);

        return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    private isInAdjustedRadius(distance: number): boolean {
        return distance < this.adjustedRadius();
    }

    private adjustedRadius(): number {
        // adjustment formula
        const COEFFICIENT: number = 0.4461;
        const POWER: number = 0.9511;
        const ADJUSTMENT_DEGREE: number = 1.1;
        const adjustment: number = ADJUSTMENT_DEGREE * (COEFFICIENT / Math.pow(this.radius, POWER));

        return this.radius + adjustment;
    }

}
