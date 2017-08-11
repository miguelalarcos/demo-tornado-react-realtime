import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
//import json from 'rollup-plugin-json';

const plugins = [
  //json(),
  replace({
      'process.env.NODE_ENV': JSON.stringify( 'production' )
    }),
  babel({
        exclude: 'node_modules/**'
      }),
  nodeResolve({
    jsnext: true,
    main: true,
    browser: true
  }),
  commonjs({
        include: 'node_modules/**',
        extensions: ['.js', '.jsx']
      })
]

const config = {
  entry: './react-client.jsx',
  dest: './dest/bundle.js',
  //format: 'es',
  format: 'iife',
  plugins: plugins
}


export default config
