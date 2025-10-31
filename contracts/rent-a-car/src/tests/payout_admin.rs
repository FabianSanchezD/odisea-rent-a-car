use soroban_sdk::{testutils::Address as _, Address, IntoVal, Symbol, vec};
use crate::{
    storage::{admin::read_commission},
    tests::config::contract::ContractTest,
};
use crate::tests::config::utils::get_contract_events;

#[test]
pub fn test_payout_admin_successfully() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let admin = Address::generate(&env);
    let amount = 4500_i128;
    let price_per_day = 300_i128;
    let owner = admin.clone();
    let renter = Address::generate(&env);
    let total_days = 4_u32;

    env.mock_all_auths();
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&admin, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);

    let commission = env.as_contract(&contract.address, || read_commission(&env));
    assert_eq!(commission, (amount/100)*2);

    contract.payout_admin(&admin, &commission);
    let contract_events = get_contract_events(&env, &contract.address);

    let contract_balance = env.as_contract(&contract.address, || read_commission(&env));
    assert_eq!(contract_balance, 0);
        assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "payout_commissions").as_val(),
                    admin.clone().into_val(&env),
                ],
                commission.into_val(&env)
            )
        ]
    );
}