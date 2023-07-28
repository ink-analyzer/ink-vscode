#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::env::{
    DefaultEnvironment,
    Environment,
};

/// Our custom environment diverges from the `DefaultEnvironment` in the event topics
/// limit.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum EnvironmentWithManyTopics {}

impl Environment for EnvironmentWithManyTopics {
    // We allow for 5 topics in the event, therefore the contract pallet's schedule must
    // allow for 6 of them (to allow the implicit topic for the event signature).
    const MAX_EVENT_TOPICS: usize =
        <DefaultEnvironment as Environment>::MAX_EVENT_TOPICS + 1;

    type AccountId = <DefaultEnvironment as Environment>::AccountId;
    type Balance = <DefaultEnvironment as Environment>::Balance;
    type Hash = <DefaultEnvironment as Environment>::Hash;
    type BlockNumber = <DefaultEnvironment as Environment>::BlockNumber;
    type Timestamp = <DefaultEnvironment as Environment>::Timestamp;

    type ChainExtension = <DefaultEnvironment as Environment>::ChainExtension;
}

#[ink::contract(env = crate::EnvironmentWithManyTopics)]
mod runtime_call {
    /// Trivial contract with a single message that emits an event with many topics.
    #[ink(storage)]
    #[derive(Default)]
    pub struct Topics;

    /// An event that would be forbidden in the default environment, but is completely
    /// valid in our custom one.
    #[ink(event)]
    #[derive(Default)]
    pub struct EventWithTopics {
        #[ink(topic)]
        first_topic: Balance,
        #[ink(topic)]
        second_topic: Balance,
        #[ink(topic)]
        third_topic: Balance,
        #[ink(topic)]
        fourth_topic: Balance,
    }

    impl Topics {
        #[ink(constructor)]
        pub fn new() -> Self {
            Default::default()
        }

        /// Emit an event with many topics.
        #[ink(message)]
        pub fn trigger(&mut self) {
            self.env().emit_event(EventWithTopics::default());
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn emits_event_with_many_topics() {
            let mut contract = Topics::new();
            contract.trigger();

            let emitted_events = ink::env::test::recorded_events().collect::<Vec<_>>();
            assert_eq!(emitted_events.len(), 1);

            let emitted_event = <EventWithTopics as scale::Decode>::decode(
                &mut &emitted_events[0].data[..],
            );

            assert!(emitted_event.is_ok());
        }
    }

    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;

        type E2EResult<T> = Result<T, Box<dyn std::error::Error>>;

        #[cfg(feature = "permissive-node")]
        #[ink_e2e::test(environment = crate::EnvironmentWithManyTopics)]
        async fn calling_custom_environment_works(
            mut client: Client<C, E>,
        ) -> E2EResult<()> {
            // given
            let constructor = TopicsRef::new();
            let contract = client
                .instantiate(
                    "custom-environment",
                    &ink_e2e::alice(),
                    constructor,
                    0,
                    None,
                )
                .await
                .expect("instantiate failed");
            let call = contract.call::<Topics>();

            // when
            let message = call.trigger();

            let call_res = client
                .call(&ink_e2e::alice(), &message, 0, None)
                .await
                .expect("call failed");

            // then
            call_res.contains_event("Contracts", "ContractEmitted");

            Ok(())
        }

        #[cfg(not(feature = "permissive-node"))]
        #[ink_e2e::test(environment = crate::EnvironmentWithManyTopics)]
        async fn calling_custom_environment_fails_if_incompatible_with_node(
            mut client: Client<C, E>,
        ) -> E2EResult<()> {
            // given
            let constructor = TopicsRef::new();
            let contract = client
                .instantiate(
                    "custom-environment",
                    &ink_e2e::alice(),
                    constructor,
                    0,
                    None,
                )
                .await
                .expect("instantiate failed");
            let mut call = contract.call::<Topics>();

            let message = call.trigger();

            // when
            let call_res = client
                .call_dry_run(&ink_e2e::alice(), &message, 0, None)
                .await;

            // then
            assert!(call_res.is_err());

            Ok(())
        }
    }
}
