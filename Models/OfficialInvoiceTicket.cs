using System.ComponentModel.DataAnnotations;

namespace Application.Models
{
  /// <summary>Links one official invoice to one or more purchased tickets.</summary>
  public class OfficialInvoiceTicket
  {
    public int Id { get; set; }

    public int OfficialInvoiceId { get; set; }
    public OfficialInvoice OfficialInvoice { get; set; } = null!;

    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }

    [MaxLength(32)]
    public string TicketCode { get; set; } = "";

    /// <summary>Ticket final price in tomans at issue time.</summary>
    public int AmountToman { get; set; }

    [MaxLength(200)]
    public string? PassengerName { get; set; }

    [MaxLength(120)]
    public string? RouteLabel { get; set; }
  }
}
