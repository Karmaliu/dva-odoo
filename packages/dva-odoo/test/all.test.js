import dvaOdoo from '../src/index';
import dvaOdooMock from '../../dva-odoo-mock/src/index';
import dvaOdooCrm from '../../dva-odoo-crm/src/index';
import dvaOdooMockCrm from '../../dva-odoo-mock-crm/src/index';

import dva from 'dva';

describe('dva-odoo', () => {
  it('all ok', (done) => {
    test_all(done);
  });
});

// mock folder
const mockContact = () => {
  return { inherit: 'res.partner.contact' };
};
const mockLogin = () => {
  return {
    admin: {
      login: 'admin',
      password: '123',
      sid: 'sid1',
      name: 'ss1',
      uid: 1,
    },
    user: {
      login: 'user',
      password: '123',
      sid: 'sid2',
      name: 'ss2',
      uid: 2,
    },
  };
};
const mockIndex = () => {
  const login = mockLogin();
  const contact = mockContact();

  const mockData = {
    contact,
    login,
    inherits: { ...dvaOdooMockCrm },
  };

  const mockService = dvaOdooMock(mockData);
  const proxy = {
    'POST /api/json/api': mockService.call,
    'POST /api/json/user/login': mockService.login,
  };

  // TBD delay()
  return proxy;
};
// mock folder

// service folder
const serviceFile = () => {
  const proxy = mockIndex();
  const service = {
    call: { url: '/api/json/api', proxy },
    login: { url: '/api/json/user/login', db: 'TT' },
  };
  return service;
};
// service folder

const getApp = () => {
  const service = serviceFile();
  const app = dva();

  const fields = {
    default: [
        'name', 'comment',
        'color', 'credit_limit',
        'date', 'image', 
        'customer', 
        'type',
        'title',
        'child_ids',
        'category_id',
    ],
    many2one: {
        title:{
          inherit:'base',
          namespace:'res.partner.title',
          fields:{default:['name']},
          comodel_name:'res.partner.title',
          domain: []
        },
    },
      
    one2many: {
        child_ids: {
          inherit:'base',
          namespace:'contact',
          fields:{default:['name']},
          comodel_name: 'res.partner', 
          inverse_name:'parent_id',
          domain: [],
          context: {},
          limit: 0
        },
    }, 
    
    many2many: {
        category_id:{
          inherit:'base',
          namespace:'res.partner.category',
          fields:{default:['name']},
          comodel_name:'res.partner.category', 
          column1: 'partner_id',
          column2: 'category_id',
          domain: [],
          context: {},
          limit: 0
        }
    },
      
  }

  const model = dvaOdoo(
    dvaOdooCrm({
      inherit: 'res.partner.contact',
      //model: 'res.partner',
      namespace: 'contact',
      service,
      fields
    })
  );

  //  console.log('model:',model);

  expect(model.namespace).toEqual('contact');
  expect(model.state).toEqual({ ids: [], id: 0 });

  const login = dvaOdoo({
    inherit: 'login',
    service,
  });

  //console.log('3,login',login)
  const odooData = dvaOdoo({
    inherit: 'odooData',
  });
  //  console.log('4,odooData',odooData)

  app.model(login);
  app.model(odooData);
  app.model(model);

  app.router(() => 1);
  app.start();
  return app;
};
const app = getApp();

const test_all = async (done) => {
  await test_login()
  await test_read()
  await test_search()
  await test_search_view()
  await test_search_write()
  await test_search_create()
  await test_search_name_create()
  await test_search_unlink()
  await test_search_findOrCreate()
  await test_search_rename()
  
  done()

}

const test = async ({type, payload, result}) => {
  const state0 = app._store.getState();
  const sss = app._store
    .dispatch({ type, payload, })
    .then(res => {
      const state = app._store.getState();
      return state
    })
    .catch((res) => {
      console.log('error', type,payload,res);
      //done();
      return 0
    });
  return sss

}

const test_login = async () => {
  const state = await test({
    type: 'login/login',
    payload: { login: 'admin', password: '123', type: 'account' },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 }
    }

  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  
}

const test_search = async () => {
  const state = await test({
    type: 'contact/search',
    payload: { domain: [] },
  })
  
  const  result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [1, 2, 3], id: 0 },
      odooData:{
            res_partner: {
              1: { id: 1, name: 'n1' },
              2: { id: 2, name: 'n2' },
              3: { id: 3, name: 'n3' },
            },
      }
    }
  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
}

const test_search_view = async () => {
  const state = await test({
    type: 'contact/view',
    payload: { id: 2 },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [1, 2, 3], id: 2 },
      odooData:{
            res_partner: {
              1: { id: 1, name: 'n1' },
              2: { id: 2, name: 'n2' },
              3: { id: 3, name: 'n3' },
            },
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  
}

const test_read = async () => {
  const state = await test({
    type: 'contact/read',
    payload: { id: 1 },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [], id: 0 },
      odooData:{
            res_partner: {
              1: { id: 1, name: 'n1' },
            },
      }
  }

  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }

}

const test_search_write = async () => {
  const state = await test({
    type: 'contact/write',
    payload: { id: 1, vals: { id: 1, email: 'win@odooht' } },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [1, 2, 3], id: 2 },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n2' },
                  3: { id: 3, name: 'n3' },
                },
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  

}

const test_search_create = async () => {
  const state = await test({
    type: 'contact/create',
    payload: { vals: { name: 'n199' } },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [4, 1, 2, 3], id: 4 },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n2' },
                  3: { id: 3, name: 'n3' },
                  4: { id: 4, name: 'n199' },
                }
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
}

const test_search_name_create = async () => {
  const state = await test({
    type: 'contact/nameCreate',
    payload: { name: 'n198' },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: { ids: [5, 4, 1, 2, 3], id: 5 },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n2' },
                  3: { id: 3, name: 'n3' },
                  5: { id: 5, name: 'n198' },
                  4: { id: 4, name: 'n199' },
                },
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
}

const test_search_unlink = async () => {
  const state = await test({
    type: 'contact/unlink',
    payload: { id: 4},
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: {
                ids: [5, 1, 2, 3],
                id: 5,
              },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n2' },
                  3: { id: 3, name: 'n3' },
                  5: { id: 5, name: 'n198' },
                },
      }
  }

  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  

}

const test_search_findOrCreate = async () => {
  const state = await test({
    type: 'contact/findOrCreate',
    payload: { email: 'win@odooht' },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: {
                ids: [6, 5, 1, 2, 3],
                id: 6,
              },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n2' },
                  3: { id: 3, name: 'n3' },
                  5: { id: 5, name: 'n198' },
                  6: { id: 6, email: 'win@odooht' },
                },
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  

}
const test_search_rename = async () => {
  const state = await test({
    type: 'contact/rename',
    payload: { id: 2, name: 'n22' },
  })

  const result = {
      login:{ name: 'ss1', sid: 'sid1', status: 'ok', uid: 1 },
      contact: {
                ids: [6, 5, 1, 2, 3],
                id: 6,
              },
      odooData:{
                res_partner: {
                  1: { id: 1, name: 'n1', email: 'win@odooht' },
                  2: { id: 2, name: 'n22' },
                  3: { id: 3, name: 'n3' },
                  5: { id: 5, name: 'n198' },
                  6: { id: 6, email: 'win@odooht' },
                },
      }
  }

  
  for( const key of Object.keys(result) ){
    expect(state[key]).toEqual(result[key]);
  }
  

}