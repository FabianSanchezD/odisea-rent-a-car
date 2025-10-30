use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, IntoVal, Address};

use crate::tests::config::contract::ContractTest;

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_remove_car() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

		let fake_admin = Address::generate(&env);
    let owner = Address::generate(&env);

    contract
        .mock_auths(&[MockAuth {
            address: &fake_admin ,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "remove_car",
                args: (owner.clone(),).into_val(&env),
                sub_invokes: &[],
            },
        }]).remove_car(&owner);
}