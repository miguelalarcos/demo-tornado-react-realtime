import React from 'react';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import Observer from 'mobx-react';

const ws = new WebSocket('ws://localhost:8888/ws');

class ObservableMsgStore {
	@observable msgs = [];
	push(data){
	    console.log('llego 2');
	    this.msgs.push(data);
	}
}

let store = new ObservableMsgStore();

ws.onopen = function open() {
  let data = {msg: 'method', method: 'add', id: 1, params: {a: 1, b: 2}}
  data = JSON.stringify(data)
  ws.send(data);

  data = {msg: 'sub', name: 'cars_of_color', id: 2, params: {color: 'red'}}
  data = JSON.stringify(data)
  ws.send(data);
};

ws.onmessage = function incoming(data) {
  console.log('->', data.data);
  store.push(data.data);
};

@Observer.observer
class Item extends React.Component{
    render() {
        return <div>{this.props.msg}</div>;
    }
}

@Observer.observer
class List extends React.Component {
    render(){
        console.log('llego');
        const msgs = this.props.store.msgs.map((msg)=><span><Item msg={msg} /></span>);
        return <div>{msgs}</div>;
    }
}

ReactDOM.render(
    <List store = {store} />,
    document.getElementById('container')
);