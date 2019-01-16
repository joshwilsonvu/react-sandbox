declare var global: any;

import * as React from "react";
import * as chai from "chai";
import { shallow, mount, render } from "enzyme";
import { spy } from "sinon";

import Sandbox from "../src/index";

chai.config.includeStack = false;
const should = chai.should();

describe("<Hello />", () => {
  it("renders the the h1", () => {
    const wrapper = shallow(<Sandbox />);
    wrapper.find("h1").should.have.length(1);
  });
});


describe('<Sandbox/>', () => {
  it("should render an iframe at the top level", () => {
    const component = renderer.create(<Sandbox/>);
    const tree = component.toJSON();
    expect(tree.type).toBe('iframe');
    //expect(tree).toMatchSnapshot();
  });
});