import React from 'react';
import PropTypes from 'prop-types';

import { forbidExtraProps } from 'airbnb-prop-types';
import { addEventListener } from 'consolidated-events';
import objectValues from 'object.values';

import contains from 'document.contains';

const DISPLAY = {
  BLOCK: 'block',
  FLEX: 'flex',
  INLINE: 'inline',
  INLINE_BLOCK: 'inline-block',
  CONTENTS: 'contents',
};

const propTypes = forbidExtraProps({
  children: PropTypes.node.isRequired,
  onOutsideClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  useCapture: PropTypes.bool,
  display: PropTypes.oneOf(objectValues(DISPLAY)),
  className: PropTypes.string,
});

const defaultProps = {
  disabled: false,

  // `useCapture` is set to true by default so that a `stopPropagation` in the
  // children will not prevent all outside click handlers from firing - maja
  useCapture: true,
  className: '',
  display: DISPLAY.BLOCK,
};

export default class OutsideClickHandler extends React.Component {
  constructor(...args) {
    super(...args);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.setChildNodeRef = this.setChildNodeRef.bind(this);
  }

  componentDidMount() {
    const { disabled, useCapture } = this.props;

    if (!disabled) this.addMouseDownEventListener(useCapture);
  }

  componentDidUpdate({ disabled: prevDisabled }) {
    const { disabled, useCapture } = this.props;
    if (prevDisabled !== disabled) {
      if (disabled) {
        this.removeEventListeners();
      } else {
        this.addMouseDownEventListener(useCapture);
      }
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  // Use mousedown/mouseup to enforce that clicks remain outside the root's
  // descendant tree, even when dragged. This should also get triggered on
  // touch devices.
  onMouseDown(e) {
    const { useCapture } = this.props;

    const isDescendantOfRoot = this.childNode && contains(this.childNode, e.target);
    if (!isDescendantOfRoot) {
      if (this.removeMouseUp) {
        this.removeMouseUp();
        this.removeMouseUp = null;
      }
      this.removeMouseUp = addEventListener(
        document,
        'mouseup',
        this.onMouseUp,
        { capture: useCapture },
      );
    }
  }

  // Use mousedown/mouseup to enforce that clicks remain outside the root's
  // descendant tree, even when dragged. This should also get triggered on
  // touch devices.
  onMouseUp(e) {
    const { onOutsideClick } = this.props;

    const isDescendantOfRoot = this.childNode && contains(this.childNode, e.target);
    if (this.removeMouseUp) {
      this.removeMouseUp();
      this.removeMouseUp = null;
    }

    if (!isDescendantOfRoot) {
      onOutsideClick(e);
    }
  }

  setChildNodeRef(ref) {
    this.childNode = ref;
  }

  addMouseDownEventListener(useCapture) {
    this.removeMouseDown = addEventListener(
      document,
      'mousedown',
      this.onMouseDown,
      { capture: useCapture },
    );
  }

  removeEventListeners() {
    if (this.removeMouseDown) this.removeMouseDown();
    if (this.removeMouseUp) this.removeMouseUp();
  }

  render() {
    const { children, display, className } = this.props;

    return (
      <div
        ref={this.setChildNodeRef}
        className={className}
        style={
          display !== DISPLAY.BLOCK && objectValues(DISPLAY).includes(display)
            ? { display }
            : undefined
        }
      >
        {children}
      </div>
    );
  }
}

OutsideClickHandler.propTypes = propTypes;
OutsideClickHandler.defaultProps = defaultProps;
