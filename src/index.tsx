import * as React from "react";


const If = (props: { cond: boolean, children: (React.Component<any, any>) }) => (
  props.cond ? props.children : null
);

const Dependency = (props: { src: string }) => <script src={props.src}/>;

const Script = (props: { script: string }) => props.script ? (
  <script>
    {`window.onload=function(){`}
    {props.script.replace(/\/>|<\//, '')}
    {`}`}
  </script>
) : (
  null
);


const Sandbox = (props: { dependencies: string | string[], script: string }) => {
  const {dependencies, script} = props;
  let depArray: string[];
  if (typeof dependencies === 'string') {
    depArray = [dependencies];
  } else {
    depArray = dependencies;
  }
  let iframe = (
    <iframe sandbox="">
      <html>
      <head>
      </head>
      <body>
      {depArray.map(
        src => <Dependency key={src} src={src}/>
      )}
      <Script script={script}/>
      </body>
      </html>
    </iframe>
  );

};

export default Sandbox;