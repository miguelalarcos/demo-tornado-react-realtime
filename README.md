# demo-tornado-react-realtime

(you must install [rethinkdb](https://www.rethinkdb.com/docs/install/))

npm install

pip install -r requirements.txt

rollup -c

rethinkdb (visit the admin page and create the collection 'cars' in the database 'test')

python main.py

open browser at localhost:8888

### main code server side

```python
class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_red_car(self, matricula):
        yield self.insert('cars', {'matricula': matricula, 'color': 'red'})

    @sub
    def cars_of_color(self, color):
        return r.table('cars').filter({'color': color})
```

### main code client side

```jsx
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
        this.matricula.set(matricula);
    }

    changeMatricula(){
        RPC.call('create_red_car', {matricula: this.matricula.get()});
        this.matricula.set('');
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
```