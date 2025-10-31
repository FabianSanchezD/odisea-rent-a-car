use soroban_sdk::{Address, Env};

use super::types::storage::DataKey;

pub(crate) fn has_admin(env: &Env) -> bool {
    let key = DataKey::Admin;

    env.storage().instance().has(&key)
}

pub(crate) fn read_admin(env: &Env) -> Address {
    let key = DataKey::Admin;

    env.storage().instance().get(&key).unwrap()
}


pub(crate) fn write_admin(env: &Env, admin: &Address) {
    let key = DataKey::Admin;

    env.storage().instance().set(&key, admin);
}

pub(crate) fn write_commission(env: &Env, commission: u32) {
    let key = DataKey::AdminCommission;

    env.storage().instance().set(&key, &commission);
}

pub(crate) fn read_commision(env: &Env) -> u32 {
    let key = DataKey::AdminCommission;

    env.storage().instance().get(&key).unwrap() // para que si no hay valor, retorne 0
    // cambiarlo porque en el modulo de scout audit vimos que esto no es seguro
}