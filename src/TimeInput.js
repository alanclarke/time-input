var React = require('react')
var CreateReactClass = require('create-react-class')
var PropTypes = require('prop-types')
var isTwelveHourTime = require('./lib/is-twelve-hour-time')
var replaceCharAt = require('./lib/replace-char-at')
var getGroupId = require('./lib/get-group-id')
var getGroups = require('./lib/get-groups')
var adder = require('./lib/time-string-adder')
var caret = require('./lib/caret')
var validate = require('./lib/validate')
var SILHOUETTE = '00:00:00:000 AM'

var TimeInput = CreateReactClass({
  getInitialState () {
    return {}
  },
  getDefaultProps () {
    return {
      value: '12:00 AM'
    }
  },
  propTypes: {
    className: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    inputClassname: PropTypes.string,
    disabled: PropTypes.bool,
    styles: PropTypes.object
  },
  render () {
    var className = 'TimeInput'
    if (this.props.className) {
      className += (' ' + this.props.className)
    }
    var inputClassname = 'TimeInput-input'
    if (this.props.inputClassname) {
      inputClassname += (' ' + this.props.inputClassname)
    }
    return (
        <div className={className} style={this.props.styles && this.props.styles.wrapper}>
          <input
              className={inputClassname}
              disabled={this.props.disabled}
              style={this.props.styles && this.props.styles.input}
              ref={(input) => {
                this.input = input
              }}
              type='text'
              value={this.format(this.props.value)}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              onKeyDown={this.handleKeyDown}
          />
        </div>
    )
  },
  format (val) {
    if (isTwelveHourTime(val)) val = val.replace(/^00/, '12')
    return val.toUpperCase()
  },
  componentDidMount () {
    this.mounted = true
  },
  componentWillUnmount () {
    this.mounted = false
  },
  componentDidUpdate () {
    var index = this.state.caretIndex
    if (index || index === 0) caret.set(this.input, index)
  },
  handleBlur () {
    if (this.mounted) this.setState({caretIndex: null})
  },
  handleEscape () {
    if (this.mounted) this.input.blur()
  },
  handleTab (event) {
    var start = caret.start(this.input)
    var value = this.props.value
    var groups = getGroups(value)
    var groupId = getGroupId(start)
    if (event.shiftKey) {
      if (!groupId) return
      groupId--
    } else {
      if (groupId >= (groups.length - 1)) return
      groupId++
    }
    event.preventDefault()
    var index = groupId * 3
    if (this.props.value.charAt(index) === ' ') index++
    if (this.mounted) this.setState({caretIndex: index})
  },
  handleArrows (event) {
    event.preventDefault()
    var start = caret.start(this.input)
    var value = this.props.value
    var amount = event.which === 38 ? 1 : -1
    if (event.shiftKey) {
      amount *= 2
      if (event.metaKey) amount *= 2
    }
    value = adder(value, getGroupId(start), amount)
    this.onChange(value, start)
  },
  silhouette () {
    return this.props.value.replace(/\d/g, function (val, i) {
      return SILHOUETTE.charAt(i)
    })
  },
  handleBackspace (event) {
    event.preventDefault()
    var start = caret.start(this.input)
    var value = this.props.value
    var end = caret.end(this.input)
    if (!start && !end) return
    var diff = end - start
    var silhouette = this.silhouette()
    if (!diff) {
      if (value[start - 1] === ':') start--
      value = replaceCharAt(value, start - 1, silhouette.charAt(start - 1))
      start--
    } else {
      while (diff--) {
        if (value[end - 1] !== ':') {
          value = replaceCharAt(value, end - 1, silhouette.charAt(end - 1))
        }
        end--
      }
    }
    if (value.charAt(start - 1) === ':') start--
    this.onChange(value, start)
  },
  handleForwardspace (event) {
    event.preventDefault()
    var start = caret.start(this.input)
    var value = this.props.value
    var end = caret.end(this.input)
    if (start === end === value.length - 1) return
    var diff = end - start
    var silhouette = this.silhouette()
    if (!diff) {
      if (value[start] === ':') start++
      value = replaceCharAt(value, start, silhouette.charAt(start))
      start++
    } else {
      while (diff--) {
        if (value[end - 1] !== ':') {
          value = replaceCharAt(value, start, silhouette.charAt(start))
        }
        start++
      }
    }
    if (value.charAt(start) === ':') start++
    this.onChange(value, start)
  },
  handleKeyDown (event) {
    if (event.which === 9) return this.handleTab(event)
    if (event.which === 38 || event.which === 40) return this.handleArrows(event)
    if (event.which === 8) return this.handleBackspace(event)
    if (event.which === 46) return this.handleForwardspace(event)
    if (event.which === 27) return this.handleEscape(event)
  },
  isSeparator (char) {
    return /[:\s]/.test(char)
  },
  handleChange (event) {
    var value = this.props.value
    var newValue = this.input.value
    // newValue += value.substr(newValue.length, value.length)
    var diff = newValue.length - value.length
    var end = caret.start(this.input)
    var insertion
    var start = end - Math.abs(diff)
    event.preventDefault()
    if (diff > 0) {
      insertion = newValue.slice(end - diff, end)
      while (diff--) {
        var oldChar = value.charAt(start)
        var newChar = insertion.charAt(0)
        if (this.isSeparator(oldChar)) {
          if (this.isSeparator(newChar)) {
            insertion = insertion.slice(1)
            start++
          } else {
            start++
            diff++
            end++
          }
        } else {
          value = replaceCharAt(value, start, newChar)
          insertion = insertion.slice(1)
          start++
        }
      }
      newValue = value
    } else {
      if (newValue.charAt(start) === ':') start++
      // apply default to selection
      var result = value
      for (var i = start; i < end; i++) {
        result = replaceCharAt(result, i, newValue.charAt(i))
      }
      newValue = result
    }
    if (validate(newValue)) {
      if (newValue.charAt(end) === ':') end++
      this.onChange(newValue, end)
    } else {
      var caretIndex = this.props.value.length - (newValue.length - end)
      if (this.mounted) this.setState({caretIndex: caretIndex})
    }
  },
  onChange: function (str, caretIndex) {
    if (this.props.onChange) this.props.onChange(this.format(str))
    if (this.mounted && typeof caretIndex === 'number') this.setState({caretIndex: caretIndex})
  }
})

module.exports = TimeInput
