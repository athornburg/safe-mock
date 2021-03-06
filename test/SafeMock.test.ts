import {expect} from "chai";
import SafeMock from "../src/SafeMock";
import {Mock, when, verify} from "../src/SafeMock";

interface SomeService {
    createSomethingNoArgs(): string;
    createSomethingOneArg(one: string): string;
    createSomethingMultipleArgs(one: string, two: string, three: string): number;
    matchesComplexArgs(thing: Complex): string;
}

class Complex {
    //noinspection JSUnusedLocalSymbols
    constructor(private arg: {a: string, b: number}) {

    }
}

describe('SafeMock', () => {
    describe("return values from mocks", () => {

        describe("setting return values via DSL", () => {
            it("allows setting return args for no arg mockedMethods", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.createSomethingNoArgs()).return("Expected Return");

                expect(mock.createSomethingNoArgs()).to.equal("Expected Return");
            });

            it("allows setting return args for 1 arg mockedMethods", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.createSomethingOneArg("ArgToTriggerReturn")).return("Some Return Value");

                expect(mock.createSomethingOneArg("ArgToTriggerReturn")).to.equal("Some Return Value");
            });

            it("allows setting multiple returnValues for mockedMethods", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.createSomethingOneArg("1")).return("one");
                when(mock.createSomethingOneArg("2")).return("two");
                when(mock.createSomethingOneArg("3")).return("three");
                when(mock.createSomethingOneArg("4")).return("four");

                expect(mock.createSomethingOneArg("4")).to.equal("four");
                expect(mock.createSomethingOneArg("3")).to.equal("three");
                expect(mock.createSomethingOneArg("2")).to.equal("two");
                expect(mock.createSomethingOneArg("1")).to.equal("one");
            });

            it("allows setting return args for 1+ arg mockedMethods", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.createSomethingMultipleArgs("arg1", "arg2", "arg3")).return(123);
                when(mock.createSomethingMultipleArgs("arg7", "arg8", "arg9")).return(789);

                expect(mock.createSomethingMultipleArgs("arg1", "arg2", "arg3")).to.equal(123);
                expect(mock.createSomethingMultipleArgs("arg7", "arg8", "arg9")).to.equal(789);
            });

            it("does not return set return value if argument's dont match", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.createSomethingOneArg("ArgToTriggerReturn")).return("Some Return Value");

                expect(mock.createSomethingOneArg("Not Matching ARgs")).not.to.equal("Some Return Value");
            });

            it("matches on Complex args correctly if objects match", function () {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                when(mock.matchesComplexArgs(new Complex({
                    a: "hello",
                    b: 123
                }))).return("Expected only for matching object");

                expect(mock.matchesComplexArgs(new Complex({
                    a: "nope",
                    b: 123
                }))).not.to.equal("Expected only for matching object");

                expect(mock.matchesComplexArgs(new Complex({
                    a: "hello",
                    b: -1
                }))).not.to.equal("Expected only for matching object");

                expect(mock.matchesComplexArgs(new Complex({
                    a: "hello",
                    b: 123
                }))).to.equal("Expected only for matching object");
            });
        });

        describe("No Return Value Set", () => {

            it("returns object from mock that throws exception if anyone tries to get a field or a method on it", () => {
                interface SomeObjectThatMockReturns {
                    thisSHouldBlowUpFromMock(): void
                    field: string
                }

                interface ObjectToMock {
                    returnTheObject(): SomeObjectThatMockReturns
                }

                const mock: Mock<ObjectToMock> = SafeMock.build<ObjectToMock>();

                expect(() => {
                    mock.returnTheObject().thisSHouldBlowUpFromMock();
                }).to.throw(`returnTheObject has not been mocked yet. Set a mock return value for it.`);

                expect(() => {
                    //noinspection JSUnusedLocalSymbols
                    const dontMindMedontMindMe = mock.returnTheObject().field;
                }).to.throw(`returnTheObject has not been mocked yet. Set a mock return value for it.`);
            });


            it("returns object from mock that throws exception with stubbed argument methods for helpful debugging", () => {
                interface SomeObjectThatMockReturns {
                    field: string
                }

                interface ObjectToMock {
                    returnTheObject(someArg: {a: string}): SomeObjectThatMockReturns
                }

                const mock: Mock<ObjectToMock> = SafeMock.build<ObjectToMock>();

                when(mock.returnTheObject({a: 'when'})).return({field: "hello"});

                expect(() => {
                    //noinspection JSUnusedLocalSymbols
                    const dontMindMe = mock.returnTheObject({a: 'not Matching'}).field;
                }).to.throw(`returnTheObject was stubbed to return a value when called with ({"a":"when"}) but was called with: ({"a":"not Matching"})`);
            });

            it("returns object from mock that throws exception if anyone tries to set a field on it", () => {
                interface SomeObjectThatMockReturns {
                    field: string
                }

                interface ObjectToMock {
                    returnTheObject(): SomeObjectThatMockReturns
                }

                const mock: Mock<ObjectToMock> = SafeMock.build<ObjectToMock>();

                expect(() => {
                    mock.returnTheObject().field = "Oh Hello";
                }).to.throw(`returnTheObject has not been mocked yet. Set a mock return value for it.`);
            });


            it("returns object from mock that throws exception if anyone tries to call it", () => {
                interface ObjectToMock {
                    returnTheObject(): () => void
                }

                const mock: Mock<ObjectToMock> = SafeMock.build<ObjectToMock>();

                expect(() => {
                    mock.returnTheObject()();
                }).to.throw(`returnTheObject has not been mocked yet. Set a mock return value for it.`);
            });
        });
    });

    describe('verifying calls', () => {
        describe('no argument methods', () => {
            it("throws an exception if Not Called", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                expect(() => {
                    verify(mock.createSomethingNoArgs).called()
                }).to.throw("createSomethingNoArgs was not called");
            });

            it("does not throw an exception if it was Called", () => {
                const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                mock.createSomethingNoArgs();

                verify(mock.createSomethingNoArgs).called()
            });
        });

        describe('Multiple argument methods', () => {

            describe('1 argument methods', () => {
                it("throws an exception if called with different arguments", () => {
                    const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                    mock.createSomethingOneArg("Actual Call");

                    expect(() => {
                        verify(mock.createSomethingOneArg).calledWith("ExpectedCall");
                    }).to.throw(`createSomethingOneArg was not called with: ("ExpectedCall")`);
                });

                it("throws an exception with previous interactions", () => {
                    const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                    mock.createSomethingOneArg("First Call");
                    mock.createSomethingOneArg("Second Call");

                    expect(() => {
                        verify(mock.createSomethingOneArg).calledWith("ExpectedCall");
                    }).to.throw(`createSomethingOneArg was not called with: ("ExpectedCall")\n` +
                        `       Other interactions with this mock: [("First Call"),("Second Call")]`);
                });

                it("does not throw exception if calls match", () => {
                    const mock: Mock<SomeService> = SafeMock.build<SomeService>();

                    mock.createSomethingOneArg("ExpectedArg!");

                    verify(mock.createSomethingOneArg).calledWith("ExpectedArg!");
                });

                it("matches verify on object arguments", () => {
                    interface ObjectArgMock {
                        methodWithObjectArg(object: {a: string, b: number}): void
                    }

                    const mock: Mock<ObjectArgMock> = SafeMock.build<ObjectArgMock>();

                    expect(() => {
                        verify(mock.methodWithObjectArg).calledWith({a: "expectedString", b: 99});
                    }).to.throw(`methodWithObjectArg was not called with: ({"a":"expectedString","b":99})`);

                    mock.methodWithObjectArg({a: "notExpectedString", b: 99});

                    expect(() => {
                        verify(mock.methodWithObjectArg).calledWith({a: "expectedString", b: 99});
                    }).to.throw();

                    mock.methodWithObjectArg({a: "expectedString", b: 99});

                    verify(mock.methodWithObjectArg).calledWith({a: "expectedString", b: 99});
                });
            });

            describe("Two Argument methods", function () {
                interface TwoArgs {
                    method(arg: number, arg2: string): void
                }

                it("throws an exception if called with different arguments", () => {
                    const mock: Mock<TwoArgs> = SafeMock.build<TwoArgs>();

                    mock.method(1, "arg2");

                    expect(() => {
                        verify(mock.method).calledWith(1, "expected");
                    }).to.throw(`method was not called with: (1, "expected")`);
                });

                it("does not throw exception if arguments match", () => {
                    interface TwoArgs {
                        method(arg: number, arg2: string): void
                    }

                    const mock: Mock<TwoArgs> = SafeMock.build<TwoArgs>();

                    mock.method(-9, "expected");

                    verify(mock.method).calledWith(-9, "expected");
                });
            });


            describe("Three+ Argument methods", function () {
                interface ThreePlus {
                    three(arg: string, arg2: string, arg3: string): void
                    four(arg: string, arg2: string, arg3: string, arg4: string): void
                    five(arg: string, arg2: string, arg3: string, arg4: string, arg5: string): void
                    six(arg: string, arg2: string, arg3: string, arg4: string, arg5: string, arg6: string): void
                    seven(arg: string, arg2: string, arg3: string, arg4: string, arg5: string, arg6: string, arg7: string): void
                    eight(arg: string, arg2: string, arg3: string, arg4: string, arg5: string, arg6: string, arg7: string, arg8: string): void
                    nine(arg: string, arg2: string, arg3: string, arg4: string, arg5: string, arg6: string, arg7: string, arg8: string, arg9: string): void
                    ten(arg: string, arg2: string, arg3: string, arg4: string, arg5: string, arg6: string, arg7: string, arg8: string, arg9: string, arg10: string): void
                }

                it("throws an exception if called with different arguments", () => {
                    const mock: Mock<ThreePlus> = SafeMock.build<ThreePlus>();

                    mock.three("1", "2", "3");
                    mock.four("1", "2", "3", "4");
                    mock.five("1", "2", "3", "4", "5");
                    mock.six("1", "2", "3", "4", "5", "6");
                    mock.seven("1", "2", "3", "4", "5", "6", "7");
                    mock.eight("1", "2", "3", "4", "5", "6", "7", "8");
                    mock.nine("1", "2", "3", "4", "5", "6", "7", "8", "9");
                    mock.ten("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");

                    expect(() => {
                        verify(mock.three).calledWith("1", "2", "Different");
                    }).to.throw("three was not called");


                    expect(() => {
                        verify(mock.four).calledWith("1", "2", "3", "Different");
                    }).to.throw("four was not called");


                    expect(() => {
                        verify(mock.five).calledWith("1", "2", "3", "4", "Different");
                    }).to.throw("five was not called");


                    expect(() => {
                        verify(mock.six).calledWith("1", "2", "3", "4", "5", "Different");
                    }).to.throw("six was not called");


                    expect(() => {
                        verify(mock.seven).calledWith("1", "2", "3", "4", "5", "6", "Different");
                    }).to.throw("seven was not called");


                    expect(() => {
                        verify(mock.eight).calledWith("1", "2", "3", "4", "5", "6", "7", "Different");
                    }).to.throw("eight was not called");


                    expect(() => {
                        verify(mock.nine).calledWith("1", "2", "3", "4", "5", "6", "7", "8", "Different");
                    }).to.throw("nine was not called");


                    expect(() => {
                        verify(mock.ten).calledWith("1", "2", "3", "4", "5", "6", "7", "8", "9", "Different");
                    }).to.throw("ten was not called");
                });

                it("does not throw an exception if called with matching args", () => {
                    const mock: Mock<ThreePlus> = SafeMock.build<ThreePlus>();

                    mock.three("1", "2", "3");
                    mock.four("1", "2", "3", "4");
                    mock.five("1", "2", "3", "4", "5");
                    mock.six("1", "2", "3", "4", "5", "6");
                    mock.seven("1", "2", "3", "4", "5", "6", "7");
                    mock.eight("1", "2", "3", "4", "5", "6", "7", "8");
                    mock.nine("1", "2", "3", "4", "5", "6", "7", "8", "9");
                    mock.ten("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");

                    verify(mock.three).calledWith("1", "2", "3");
                    verify(mock.four).calledWith("1", "2", "3", "4");
                    verify(mock.five).calledWith("1", "2", "3", "4", "5");
                    verify(mock.six).calledWith("1", "2", "3", "4", "5", "6");
                    verify(mock.seven).calledWith("1", "2", "3", "4", "5", "6", "7");
                    verify(mock.eight).calledWith("1", "2", "3", "4", "5", "6", "7", "8");
                    verify(mock.nine).calledWith("1", "2", "3", "4", "5", "6", "7", "8", "9");
                    verify(mock.ten).calledWith("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");
                });
            });
        });
    });
});
