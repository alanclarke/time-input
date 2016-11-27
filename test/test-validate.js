/* global describe it */
var expect = require('chai').expect
var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-addons-test-utils')

var caret = require('../src/lib/caret')
var TimeInput = require('../src/TimeInput')


describe('validate prop', function () {
  it('should allow a custom validate function to be used', function () {
    document.body.innerHTML = '<div></div>'

    var result
    var timeInput = ReactDOM.render((
      <TimeInput
        defaultValue='0:00:00:000'
        onChange={function (val) {
          result = val
        }}
        validate={validator}
        value='1:11:11:111 AM'
      />
    ), document.body.firstElementChild)
    timeInput.input.value = '71:11:11:111 AM';
    caret.set(timeInput.input, 1)
    ReactTestUtils.Simulate.change(timeInput.input)

    expect(result).to.eql('7:11:11:111 AM');

    function validator(val) {
      return /^(1[0-2]|[1-9]):[0-5][0-9](:[0-5][0-9](:[0-9][0-9][0-9])?)?(\s+[ap]m)?$/i.test(val)
    }
  })
})
