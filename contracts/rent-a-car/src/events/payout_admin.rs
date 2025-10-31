use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn payout(env: &Env, admin: Address, amount: i128) {
    let topics = (Symbol::new(env, "payout (commissions)"), admin.clone());

    env.events().publish(
        topics,
        amount
    );
}