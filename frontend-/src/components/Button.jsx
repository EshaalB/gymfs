import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <a className="btn-glitch-fill">
        <span className="text">// Enter</span><span className="text-decoration"> _</span><span className="decoration">⇒</span>
      </a>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  [class*="btn-glitch-"] {
    display: inline-block;
    font-family: "VT323", monospace;
    border: 1px solid rgb(255, 255, 255);
    color: rgb(255, 255, 255);
    padding: 10px 13px;
    min-width: 175px;
    line-height: 1.5em;
    white-space: no-wrap;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 15px;

    .text,
    .decoration {
      display: inline-block;
    }

    .decoration {
      display: inline-block;
      float: right;
    }

    &:hover,
    &:focus {
      animation-name: glitch;
      animation-duration: 0.2s;
      background-color: yellow;
      color: black;
      border: 1px solid yellow;

      .text-decoration {
        animation-name: blink;
        animation-duration: 0.1s;
        animation-iteration-count: infinite;
      }

      .decoration {
        animation-name: blink;
        animation-duration: 0.1s;
        animation-iteration-count: infinite;
      }
    }

    &:active {
      background: none;
      color: yellow;

      .text-decoration {
        animation-name: none;
      }

      .decoration {
        animation-name: none;
      }

      :before,
      :after {
        display: none;
      }
    }
  }

  @keyframes glitch {
    25% {
      background-color: red;
      transform: translateX(-10px);
      letter-spacing: 10px;
    }

    35% {
      background-color: green;
      transform: translate(10px);
    }

    59% {
      opacity: 0;
    }

    60% {
      background-color: blue;
      transform: translate(-10px);
      filter: blur(5px);
    }

    100% {
      background-color: yellow;
      blur: (5px);
    }
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @keyframes shrink {
    100% {
      width: 10%;
    }
  }`;

export default Button;
