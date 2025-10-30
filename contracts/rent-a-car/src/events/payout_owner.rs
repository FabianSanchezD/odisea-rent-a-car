use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn payout(env: &Env, owner: Address, amount: i128) {
    let topics = (Symbol::new(env, "payout"), owner.clone());

    env.events().publish(
        topics,
        amount
    );
}