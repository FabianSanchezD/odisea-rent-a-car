use soroban_sdk::{testutils::Address as _, Address, vec, IntoVal, Symbol};
use crate::{storage::{car::has_car}, tests::config::contract::ContractTest};
use crate::tests::config::utils::get_contract_events;

#[test]
pub fn test_remove_car_deletes_from_storage() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    env.mock_all_auths();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    contract.add_car(&owner, &price_per_day);
    assert!(env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));

    contract.remove_car(&owner);
    let contract_events = get_contract_events(&env, &contract.address);

    assert!(!env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));

    assert_eq!(
        contract_events,
        vec![
            &env,
            (
                contract.address.clone(),
                vec![
                    &env,
                    *Symbol::new(&env, "car_removed").as_val(),
                    owner.clone().into_val(&env),
                ],
                ().into_val(&env)
            )
        ]
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
pub fn test_remove_car_not_found_fails() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    env.mock_all_auths();

    let owner = Address::generate(&env);
    
    contract.remove_car(&owner);
}
