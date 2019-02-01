import { injectable } from "inversify";

@injectable()
export class CircleDifferences {
    private readonly IS_A_DIFFERENCE: number = 1;
    private circledDifferenceList: number[];

    public constructor(public differencesArray: number[], public width: number, public radius: number) {
        // deep copy array
        this.circledDifferenceList = JSON.parse(JSON.stringify(differencesArray));
    }

    public circleAllDifferences(): number[] {
        let index: number = 0;

        this.differencesArray.forEach( (value: number) => {
            if (value === this.IS_A_DIFFERENCE) {
                this.drawCircle(index);
            }
            index++;
        });

        return this.circledDifferenceList;
    }

    private drawCircle(positionToCircle: number): void {
        // to get the square size where the draw circle should be called
        const squareSize: number = this.radius + this.radius + 1;
        const startIndex: number = this.getSquareStartIndex(positionToCircle);

        for (let row: number = 0; row < squareSize; row++) {
            for (let col: number = 0; col < squareSize; col++) {

                const currentPosition: number = row * this.width + col + startIndex;
                if (currentPosition >= 0 && currentPosition < this.differencesArray.length) {
                    const currentDistanceToCenter: number = this.findDistanceBetween(positionToCircle, currentPosition);

                    if (this.isInAdjustedRadius(currentDistanceToCenter)) {
                        this.circledDifferenceList[currentPosition] = this.IS_A_DIFFERENCE;
                    }
                }
            }
        }
    }

    private getSquareStartIndex(centerPositionIndex: number): number {
        return centerPositionIndex - this.width * this.radius - this.radius;
    }

    private findDistanceBetween(centerPosition: number, periphericPosition: number): number {
        const deltaX: number = periphericPosition % this.width - centerPosition % this.width;
        const deltaY: number = Math.floor(periphericPosition / this.width) - Math.floor(centerPosition / this.width);

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
