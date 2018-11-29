import RPC from './rpc'
import Environment from './env'

class Odoo {
    constructor(options){
        const { host，db } = options
        this.env = {}
        this.rpc = RPC({ host,db })
    }

    async login(params){
        const data = await this.rpc.login(params )
        this.env = new Environment({ rpc:this.rpc})
        return data
    }

}

export default Odoo
