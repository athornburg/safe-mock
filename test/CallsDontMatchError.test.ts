import {expect} from "chai";
import CallsDontMatchError from '../src/CallsDontMatchError';
import ArgumentInvocation from "../src/ArgumentInvocation";

describe('CallsDontMatchError', () => {
    describe("message", () => {
        it("Displays objects as JSON", () => {
            const message = new CallsDontMatchError(
                new ArgumentInvocation([{a: "string", b: 1}]),
                [[{a: "other", b: 2}], [{a: "also", b: 2}]].map(args => new ArgumentInvocation(args)),
                'method').message;

            expect(message).to.contain(`method was not called with: ({"a":"string","b":1})`);

            expect(message).to.contain(`Other interactions with this mock: [({"a":"other","b":2}),({"a":"also","b":2})]`);
        });

        it("Groups Other interactions with this mock in ()", () => {
            const message = new CallsDontMatchError(new ArgumentInvocation(['expected1', 'expected2']), [['actual1', 'actual2'], ['other1', 'other2']].map(args => new ArgumentInvocation(args)), 'method').message;

            expect(message).to.contain(`Other interactions with this mock: [("actual1", "actual2"),("other1", "other2")]`);
        });

        it("Displays Classes With ClassName", () => {
            const message = new CallsDontMatchError(new ArgumentInvocation([new IWantToBePrettyPrinted("hello"), 1, "stringsStayTheSame"]), [], 'method').message;

            expect(message).to.contain(`method was not called with: (IWantToBePrettyPrinted{"a":"hello"}, 1, "stringsStayTheSame")`);
        });

        it("Does Not Show Other Interactions with Mock if none occured", () => {
            const message = new CallsDontMatchError(new ArgumentInvocation([new IWantToBePrettyPrinted("hello"), 1, "stringsStayTheSame"]), [], 'method').message;

            expect(message).not.to.contain(`Other interactions with this mock:`);
        });
    });
});

class IWantToBePrettyPrinted {
    //noinspection JSUnusedGlobalSymbols
    constructor(public a: string) {
    }
}
