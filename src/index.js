import { css, setup as gooberSetup } from "goober";
import {
  mergeProps,
  splitProps,
  createContext,
  useContext,
  createComponent,
  untrack
} from "solid-js";
import { spread, ssr, ssrSpread, isServer } from "solid-js/web";
export { css, glob, extractCss, keyframes } from "goober";
export function setup(prefixer) {
  gooberSetup(null, prefixer);
}
const ThemeContext = createContext();
export function ThemeProvider(props) {
  return createComponent(ThemeContext.Provider, {
    value: props.theme,
    get children() {
      return props.children;
    }
  });
}
export function useTheme() {
  return useContext(ThemeContext);
}

function makeStyled(tag) {
  let _ctx = this || {};
  return (...args) => {
    const Styled = props => {
      const theme = useContext(ThemeContext);
      const withTheme = mergeProps(props, { theme });
      const clone = mergeProps(withTheme, {
        get class() {
          const pClass = withTheme.class,
            append = "class" in withTheme && /^go[0-9]+/.test(pClass);
          // Call `css` with the append flag and pass the props
          let className = css.apply(
            { target: _ctx.target, o: append, p: withTheme, g: _ctx.g },
            args
          );
          return [pClass, className].filter(Boolean).join(" ");
        }
      });
      const [local, newProps] = splitProps(clone, ["as", "theme"]);
      const createTag = local.as || tag;
      let el;
      if (typeof createTag === "function") {
        el = createTag(newProps);
      } else if (isServer) {
        const [local, others] = splitProps(newProps, ["children", "theme"]);
        el = ssr(
          [`<${createTag} `, ">", `</${createTag}>`],
          ssrSpread(others),
          local.children || ""
        );
      } else {
        el = document.createElement(createTag);
        spread(el, newProps);
      }
      return el;
    };
    Styled.class = props => {
      return untrack(() => {
        return css.apply({ target: _ctx.target, p: props, g: _ctx.g }, args);
      });
    };
    return Styled;
  };
}

export const styled = new Proxy(makeStyled, {
  get(target, tag) {
    return target(tag);
  },
})

export function createGlobalStyles() {
  const fn = makeStyled.call({ g: 1 }, "div").apply(null, arguments);
  return function GlobalStyles(props) {
    fn(props);
    return null;
  };
}
