import React from "react"

const SvgMinMaxBtn = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24" 
    height="10px"
    {...props}
  >
  {props.is_minimized === "true"? 
  <path 
  d="M19 3H5C3.89 3 3 3.89 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3ZM19 5V19H5V5H19Z" 
  fill="#707070"
  stroke="#707070" 
  strokeWidth="0.7" 
  /> :
  <>
    <path d="M2 22L2.875 21.125M9 15H3.14286M9 15V20.8571M9 15L5.5 18.5" stroke="#707070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 9M15 9H20.8571M15 9V3.14286" stroke="#707070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </>
 }  </svg>
)

export default SvgMinMaxBtn