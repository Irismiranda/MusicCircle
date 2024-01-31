import React from "react"

const SvgMoreIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 19 16"
    fill="none"
    stroke={props.color} 
    strokeWidth="2.5"
    strokeLinecap="round"
    {...props}
  >
<path d="M2 8H17"/>
<path d="M2 14H17"/>
<path d="M2 2H17"/>
</svg>
)

export default SvgMoreIcon