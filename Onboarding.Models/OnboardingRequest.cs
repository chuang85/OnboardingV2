using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Onboarding.Models
{
    public class OnboardingRequestMetadata
    {
        [Key]
        public int RequestId { get; set; }

        public DateTime CreatedDate { get; set; }

        public string DisplayCreatedDate { get; set; }

        public DateTime ModifiedDate { get; set; }

        public string DisplayModifiedDate { get; set; }

        [Required]
        public string CreatedBy { get; set; }

        public RequestState State { get; set; }

        public string CodeFlowId { get; set; }

        public int ChangelistNumber { get; set; }

        public int BuildNumber { get; set; }

        public int RTONumber { get; set; }
    }

    public class OnboardingRequest : OnboardingRequestMetadata
    {
        public string DisplayName { get; set; }

        public bool NeedS2S { get; set; }

        public bool NeedGraph { get; set; }

        public Spt Spt { get; set; }
    }

    public class Spt
    {
        public Guid AppPrincipalId { get; set; }

        public Guid KeyGroupId { get; set; }

        public virtual ICollection<TaskSet> TaskSets { get; set; }

        public bool ManagedInternally { get; set; }

        public bool ExternalUserAccountDelegationsAllowed { get; set; }

        public virtual ICollection<string> ConstrainedDelegationTo { get; set; }

    }

    public enum RequestType
    {
        [Description("Create SPT")]
        CreateSPT = 5,
        [Description("Update SPT")]
        UpdateSPT = 10,
        [Description("Create Application")]
        CreateApplication = 15,
        [Description("Update Application")]
        UpdateApplication = 20,
        [Description("Add Cert To KeyGroup")]
        AddCertToKeyGroup = 25
    }

    public enum RequestState
    {
        [Description("Created")]
        Created = 100,
        [Description("Pending Review")]
        PendingReview = 110,
        [Description("Review Completed")]
        ReviewCompleted = 120,
        [Description("RTD Queued")]
        RTDQueued = 130,
        [Description("RTD Approved")]
        RTDApproved = 140,
        [Description("Completed")]
        Completed = 150,
        [Description("Canceled")]
        Canceled = 160
    }
}