import { expect } from "chai";
import {TimeManagerService } from "../services/time-manager.service";
import sinon = require("sinon");

// tslint:disable:no-magic-numbers no-any

let timeManagerService: TimeManagerService;

beforeEach(() => {
    timeManagerService = new TimeManagerService();
});

describe("TimeManagerService Tests", () => {

    it ("should return string length of 8 character", (done: Function) => {
        const result: string = timeManagerService.getTimeNow();
        expect(result.length).to.be.equal(8);
        done();
    });

    it ("should return string length of 8 character", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(1010);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        expect(result.length).to.be.equal(8);
        done();
    });

    it ("should return string equal to 19:00:01", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(1010);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "19:00:01";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 08:46:39", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(999999999);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "08:46:39";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 01:54:48", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(888888888);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "01:54:48";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 20:34:48", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(888888888999);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "20:34:48";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 19:02:03", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(123098);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "19:02:03";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 05:12:03", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(123123098);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "05:12:03";
        expect(result).to.be.equal(expectedResult);
        done();
    });

    it ("should return string equal to 05:12:24", (done: Function) => {
        const clock: any = sinon.useFakeTimers();
        clock.tick(123144444);
        const result: string = timeManagerService.getTimeNow();
        clock.restore();
        const expectedResult: string = "05:12:24";
        expect(result).to.be.equal(expectedResult);
        done();
    });

});