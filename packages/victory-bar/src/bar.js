import React from "react";
import PropTypes from "prop-types";
import { Helpers, CommonProps, Path } from "victory-core";
import { assign, isPlainObject, isNil } from "lodash";

import {
  getVerticalBarPath,
  getHorizontalBarPath,
  getVerticalPolarBarPath,
  getCustomBarPath
} from "./path-helper-methods";

// eslint-disable-next-line max-params
const getBarPath = (props, width, cornerRadius, barOffset) => {
  if (props.getPath) {
    return getCustomBarPath(props, width);
  }

  return props.horizontal
    ? getHorizontalBarPath(props, width, cornerRadius, barOffset)
    : getVerticalBarPath(props, width, cornerRadius, barOffset);
};

const getPolarBarPath = (props, cornerRadius) => {
  // TODO Radial bars
  return getVerticalPolarBarPath(props, cornerRadius);
};

const getBarWidth = (barWidth, props) => {
  const { scale, data, defaultBarWidth, style } = props;
  if (barWidth) {
    return Helpers.evaluateProp(barWidth, props);
  } else if (style.width) {
    return style.width;
  }
  const range = scale.x.range();
  const extent = Math.abs(range[1] - range[0]);
  const bars = data.length + 2;
  const barRatio = props.barRatio || 0.5;
  const defaultWidth = barRatio * (data.length < 2 ? defaultBarWidth : extent / bars);
  return Math.max(1, defaultWidth);
};

const getCornerRadiusFromObject = (cornerRadius, props) => {
  const realCornerRadius = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  const updateCornerRadius = (corner, fallback) => {
    if (!isNil(cornerRadius[corner])) {
      realCornerRadius[corner] = Helpers.evaluateProp(cornerRadius[corner], props);
    } else if (!isNil(cornerRadius[fallback])) {
      realCornerRadius[corner] = Helpers.evaluateProp(cornerRadius[fallback], props);
    }
  };
  updateCornerRadius("topLeft", "top");
  updateCornerRadius("topRight", "top");
  updateCornerRadius("bottomLeft", "bottom");
  updateCornerRadius("bottomRight", "bottom");
  return realCornerRadius;
};

const getCornerRadius = (cornerRadius, props) => {
  const realCornerRadius = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  if (!cornerRadius) {
    return realCornerRadius;
  }
  if (isPlainObject(cornerRadius)) {
    return getCornerRadiusFromObject(cornerRadius, props);
  } else {
    realCornerRadius.topLeft = Helpers.evaluateProp(cornerRadius, props);
    realCornerRadius.topRight = Helpers.evaluateProp(cornerRadius, props);
    return realCornerRadius;
  }
};

const getStyle = (style = {}, props) => {
  const stroke = style.fill || "black";
  const baseStyle = { fill: "black", stroke };
  return Helpers.evaluateStyle(assign(baseStyle, style), props);
};

const getBarOffset = (barOffset, props) => {
  return Helpers.evaluateProp(barOffset, props);
};

const evaluateProps = (props) => {
  // Potential evaluated props are 1) `style`, 2) `barWidth` and 3) `cornerRadius`
  const style = getStyle(props.style, props);
  const barWidth = getBarWidth(props.barWidth, assign({}, props, { style }));
  const cornerRadius = getCornerRadius(props.cornerRadius, assign({}, props, { style, barWidth }));
  const barOffset = getBarOffset(props.barOffset, props);
  return assign({}, props, { style, barWidth, cornerRadius, barOffset });
};

const Bar = (props) => {
  props = evaluateProps(props);
  const { polar, origin, style, barWidth, cornerRadius, barOffset } = props;

  const path = polar
    ? getPolarBarPath(props, cornerRadius)
    : getBarPath(props, barWidth, cornerRadius, barOffset);
  const defaultTransform = polar && origin ? `translate(${origin.x}, ${origin.y})` : undefined;

  return React.cloneElement(props.pathComponent, {
    ...props.events,
    style,
    d: path,
    transform: props.transform || defaultTransform,
    className: props.className,
    role: props.role,
    shapeRendering: props.shapeRendering,
    clipPath: props.clipPath,
    desc: Helpers.evaluateProp(props.desc, props),
    tabIndex: Helpers.evaluateProp(props.tabIndex, props)
  });
};

Bar.propTypes = {
  ...CommonProps.primitiveProps,
  alignment: PropTypes.oneOf(["start", "middle", "end"]),
  barOffset: PropTypes.arrayOf(PropTypes.number),
  barRatio: PropTypes.number,
  barWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  cornerRadius: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.func,
    PropTypes.shape({
      top: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
      topLeft: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
      topRight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
      bottom: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
      bottomLeft: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
      bottomRight: PropTypes.oneOfType([PropTypes.number, PropTypes.func])
    })
  ]),
  datum: PropTypes.object,
  getPath: PropTypes.func,
  horizontal: PropTypes.bool,
  pathComponent: PropTypes.element,
  width: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
  y0: PropTypes.number
};

Bar.defaultProps = {
  defaultBarWidth: 8,
  pathComponent: <Path />,
  role: "presentation",
  shapeRendering: "auto"
};

export default Bar;
