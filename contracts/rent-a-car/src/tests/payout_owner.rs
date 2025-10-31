use soroban_sdk::{testutils::Address as _, Address, IntoVal, Symbol, vec};
use crate::{
    storage::{car::{read_car, write_car}, contract_balance::read_contract_balance},
    storage::types::car_status::CarStatus,
    tests::config::contract::ContractTest,
};
use crate::tests::config::utils::get_contract_events;

#[test]
pub fn test_payout_owner_successfully() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;

    env.mock_all_auths();
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    token_admin.mint(&renter, &amount_mint);

    contract.add_car(&owner, &price_per_day);
    contract.rental(&renter, &owner, &total_days, &amount);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    let commission = (amount/100)*2;
    let net = amount - commission; // lo que se deja el contrato
    assert_eq!(contract_balance, net);

    // cambiar el estado del carro a available
    env.as_contract(&contract.address, || {
        let mut car = read_car(&env, &owner);
        car.car_status = CarStatus::Available;
        write_car(&env, &owner, &car);
    });

    contract.payout_owner(&owner, &net);
    let contract_events = get_contract_events(&env, &contract.address);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner));
    assert_eq!(car.available_to_withdraw, commission);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, 0);
        assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "payout").as_val(),
                    owner.clone().into_val(&env),
                ],
                net.into_val(&env)
            )
        ]
    );
}