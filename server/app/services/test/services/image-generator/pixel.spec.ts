// tslint:disable:no-magic-numbers no-any
import { expect } from "chai";
import { Pixel } from "../../../image-generator/utilitaries/pixel";

let pixel: Pixel;

beforeEach(() => {
    pixel = new Pixel(1, 2, 3, 4);
});

describe("Pixel test", () => {

    it ("should return 1 if get red", (done: Function) => {
        const result: number = pixel.getRed();
        expect(result).to.equal(1);
        done();
    });

    it ("should return 2 if get green", (done: Function) => {
        const result: number = pixel.getGreen();
        expect(result).to.equal(2);
        done();
    });

    it ("should return 3 if get blue", (done: Function) => {
        const result: number = pixel.getBlue();
        expect(result).to.equal(3);
        done();
    });

    it ("should return 4 if get alpha", (done: Function) => {
        const result: number = pixel.getAlpha();
        expect(result).to.equal(4);
        done();
    });

    it ("should return true if pixels are equal", (done: Function) => {
        const testPixel: Pixel = new Pixel(1, 2, 3, 4);
        const result: Boolean = pixel.isEqual(testPixel);
        expect(result).to.equal(true);
        done();
    });

    it ("should return false if pixels are not equal", (done: Function) => {
        const testPixel: Pixel = new Pixel(4, 3, 2, 1);
        const result: Boolean = pixel.isEqual(testPixel);
        expect(result).to.equal(false);
        done();
    });

});
