import React from 'react';
import Observer from 'mobx-react';
import {start, SubsComponent, RPC} from "./sdp.jsx";
import { observable } from 'mobx';

@Observer.observer
class Item extends React.Component{
    constructor(){
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        const to_color = this.props.msg.color === 'red'? 'blue': 'red';
        RPC.call('change_color', {id: this.props.msg.id, color: to_color});
    }

    render() {
        return <div>{this.props.msg.matricula}<a href="#" onClick={this.handleClick}>change color</a></div>;
    }
}

@Observer.observer
class Cars extends SubsComponent{
    constructor(props){
        super();
        this.sub('cars_of_color', {color: props.color});
    }

    render(){
        const msgs = this.store.map((msg)=><span><Item msg={msg} color={this.color} /></span>);
        return <div>{msgs}</div>;
    }
}

@Observer.observer
class App extends React.Component{
    constructor(){
        super();
        this.matricula = observable('');
    }

    changeTextMatricula(matricula){
        console.log('matricula:', matricula);
        this.matricula.set(matricula);
    }

    changeMatricula(){
        RPC.call('create_red_car', {matricula: this.matricula.get()});
    }

    render(){
        return (
            <div>
                <div>
                    <input type="text" value={this.matricula.get()} onChange={(evt)=>this.changeTextMatricula(evt.target.value)}/>
                    <button onClick={()=>this.changeMatricula()}>create red car</button>
                </div>
                <div>Red cars</div>
                <Cars color={'red'} />
                <div>Blue cars</div>
                <Cars color={'blue'} />
            </div>
        );
    }
}

start(App);
